use rand::Rng;
use std::{
    cmp::{max, min},
    collections::HashMap,
    time::{Duration, Instant},
};
use ultimatexo_core::{
    AppError,
    models::{Board, GameState, MacroBoard, Marker, Status},
};

const MAX_BOARDS: usize = 9;
const MAX_CELLS: usize = 9;
const WINNING_LINES: [[usize; 3]; 8] = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
];

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub struct DifficultyLevel(u8);

impl DifficultyLevel {
    pub fn new(level: u8) -> Result<Self, AppError> {
        if !(1..=10).contains(&level) {
            Err(AppError::invalid_bot_level())
        } else {
            Ok(Self(level))
        }
    }

    pub fn beginner() -> Self {
        Self(1)
    }

    pub fn intermediate() -> Self {
        Self(4)
    }

    pub fn advanced() -> Self {
        Self(7)
    }

    pub fn level(&self) -> u8 {
        self.0
    }
}

impl Default for DifficultyLevel {
    fn default() -> Self {
        Self::intermediate()
    }
}

#[derive(Debug, Clone)]
pub struct AIConfig {
    pub max_depth: usize,
    pub max_time: Option<Duration>,
    pub weights: EvaluationWeights,
    pub use_move_ordering: bool,
    pub random_move_chance: f64,
    pub mistake_chance: f64,
    pub mistake_pool_size: usize,
    pub use_killer_moves: bool,
}

impl AIConfig {
    pub fn from_level(level: DifficultyLevel) -> Self {
        let (depth, time_ms, random_chance, mistake_chance, pool_size, use_ordering, use_killer) =
            match level.0 {
                1 => (1, 100, 0.30, 0.50, 5, false, false),
                2 => (2, 200, 0.20, 0.35, 4, false, false),
                3 => (3, 500, 0.10, 0.20, 3, false, false),
                4 => (4, 1000, 0.05, 0.12, 3, true, false),
                5 => (5, 2000, 0.02, 0.08, 2, true, false),
                6 => (6, 3000, 0.0, 0.05, 2, true, true),
                7 => (7, 5000, 0.0, 0.02, 2, true, true),
                8 => (8, 8000, 0.0, 0.0, 1, true, true),
                9 => (9, 12000, 0.0, 0.0, 1, true, true),
                10 => (10, 20000, 0.0, 0.0, 1, true, true),
                _ => (5, 2000, 0.02, 0.08, 2, true, false),
            };

        Self {
            max_depth: depth,
            max_time: Some(Duration::from_millis(time_ms)),
            weights: EvaluationWeights::from_level(level),
            use_move_ordering: use_ordering,
            random_move_chance: random_chance,
            mistake_chance,
            mistake_pool_size: pool_size,
            use_killer_moves: use_killer,
        }
    }
}

impl Default for AIConfig {
    fn default() -> Self {
        Self::from_level(DifficultyLevel::default())
    }
}

#[derive(Debug, Clone)]
pub struct EvaluationWeights {
    pub game_win: i32,
    pub game_loss: i32,
    pub center_board: i32,
    pub corner_board: i32,
    pub edge_board: i32,
    pub macro_two_in_row: i32,
    pub macro_one_in_row: i32,
    pub macro_block_two: i32,
    pub macro_block_one: i32,
    pub board_in_critical_line: i32,
    pub board_in_threat_line: i32,
    pub micro_two_in_row: i32,
    pub micro_one_in_row: i32,
    pub micro_center: i32,
    pub micro_corner: i32,
    pub fork_bonus: i32,
    pub next_board_penalty: i32,
    pub mobility_bonus: i32,
}

impl EvaluationWeights {
    fn from_level(level: DifficultyLevel) -> Self {
        let scale = level.0 as i32;
        Self {
            game_win: 100000,
            game_loss: -100000,
            center_board: 70 + scale * 5,
            corner_board: 40 + scale * 3,
            edge_board: 30 + scale * 2,
            macro_two_in_row: 3000 + scale * 400,
            macro_one_in_row: 500 + scale * 70,
            macro_block_two: 2500 + scale * 400,
            macro_block_one: 400 + scale * 70,
            board_in_critical_line: 200 + scale * 30,
            board_in_threat_line: 60 + scale * 12,
            micro_two_in_row: 30 + scale * 4,
            micro_one_in_row: 5 + scale,
            micro_center: 3 + (scale / 2),
            micro_corner: 1 + (scale / 3),
            fork_bonus: 1000 + scale * 150,
            next_board_penalty: 8 + scale,
            mobility_bonus: 1 + (scale / 3),
        }
    }
}

impl Default for EvaluationWeights {
    fn default() -> Self {
        Self::from_level(DifficultyLevel::default())
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct Move {
    pub board_index: usize,
    pub cell_index: usize,
}

impl Move {
    pub fn new(board_index: usize, cell_index: usize) -> Self {
        Self {
            board_index,
            cell_index,
        }
    }
}

#[derive(Debug, Default)]
pub struct KillerMoves {
    moves: HashMap<usize, [Option<Move>; 2]>,
}

impl KillerMoves {
    fn new() -> Self {
        Self::default()
    }

    fn add(&mut self, depth: usize, mov: Move) {
        let entry = self.moves.entry(depth).or_insert([None, None]);
        if entry[0] != Some(mov) {
            entry[1] = entry[0];
            entry[0] = Some(mov);
        }
    }

    fn get(&self, depth: usize) -> &[Option<Move>; 2] {
        static EMPTY: [Option<Move>; 2] = [None, None];
        self.moves.get(&depth).unwrap_or(&EMPTY)
    }

    fn is_killer(&self, depth: usize, mov: Move) -> bool {
        let killers = self.get(depth);
        killers[0] == Some(mov) || killers[1] == Some(mov)
    }
}

pub struct StateEvaluator {
    weights: EvaluationWeights,
}

impl StateEvaluator {
    pub fn new(weights: EvaluationWeights) -> Self {
        Self { weights }
    }

    pub fn evaluate(&mut self, state: &GameState, ai_player: Marker) -> i32 {
        let opponent = !ai_player;

        match state.board.status {
            Status::Won(winner) if winner == ai_player => return self.weights.game_win,
            Status::Won(winner) if winner == opponent => return self.weights.game_loss,
            Status::Draw => return 0,
            _ => {}
        }

        let mut score = 0;
        let board_values = self.calculate_board_values(&state.board, ai_player);

        for (i, board) in state.board.boards.iter().enumerate() {
            match board.status {
                Status::Won(winner) if winner == ai_player => {
                    score += board_values[i];
                }
                Status::Won(winner) if winner == opponent => {
                    score -= board_values[i];
                }
                Status::InProgress => {
                    let micro_score = self.evaluate_micro_board(board, ai_player);
                    score += (micro_score * board_values[i]) / 100;
                }
                _ => {}
            }
        }

        score += self.evaluate_macro_position(&state.board, ai_player);
        score += self.evaluate_forks(&state.board, ai_player);

        if let Some(next_board) = state.next_board {
            score += self.evaluate_next_board(&state.board, next_board, opponent);
        }

        let move_count = MoveGenerator::count_moves(state);
        score += (move_count as i32) * self.weights.mobility_bonus;

        score
    }

    fn calculate_board_values(&mut self, board: &Board, ai_player: Marker) -> [i32; MAX_BOARDS] {
        let mut values = [0i32; MAX_BOARDS];
        let w = &self.weights;

        let base = [
            w.corner_board,
            w.edge_board,
            w.corner_board,
            w.edge_board,
            w.center_board,
            w.edge_board,
            w.corner_board,
            w.edge_board,
            w.corner_board,
        ];

        for line in &WINNING_LINES {
            let (ai_won, opp_won, _) = self.count_line_status(board, line, ai_player);

            if ai_won > 0 && opp_won == 0 {
                let bonus = if ai_won == 2 {
                    w.board_in_critical_line
                } else {
                    w.board_in_threat_line
                };

                for &pos in line {
                    if matches!(board.boards[pos].status, Status::InProgress) {
                        values[pos] += bonus;
                    }
                }
            }

            if opp_won > 0 && ai_won == 0 {
                let penalty = if opp_won == 2 {
                    w.board_in_critical_line
                } else {
                    w.board_in_threat_line / 2
                };

                for &pos in line {
                    if matches!(board.boards[pos].status, Status::InProgress) {
                        values[pos] += penalty;
                    }
                }
            }
        }

        for i in 0..MAX_BOARDS {
            values[i] += base[i];
        }

        values
    }

    fn evaluate_macro_position(&self, board: &Board, ai_player: Marker) -> i32 {
        let mut score = 0;
        let w = &self.weights;

        for line in &WINNING_LINES {
            let (ai_won, opp_won, in_progress) = self.count_line_status(board, line, ai_player);

            if opp_won == 0 && ai_won > 0 {
                score += match (ai_won, in_progress) {
                    (2, 1) => w.macro_two_in_row,
                    (1, _) => w.macro_one_in_row,
                    _ => 0,
                };
            }

            if ai_won == 0 && opp_won > 0 {
                score -= match (opp_won, in_progress) {
                    (2, 1) => w.macro_block_two,
                    (1, _) => w.macro_block_one,
                    _ => 0,
                };
            }
        }

        score
    }

    fn evaluate_forks(&self, board: &Board, ai_player: Marker) -> i32 {
        let mut ai_threats = 0;
        let mut opp_threats = 0;

        for line in &WINNING_LINES {
            let (ai_won, opp_won, available) = self.count_line_status(board, line, ai_player);

            if ai_won == 2 && opp_won == 0 && available == 1 {
                ai_threats += 1;
            }
            if opp_won == 2 && ai_won == 0 && available == 1 {
                opp_threats += 1;
            }
        }

        let fork_bonus = if ai_threats >= 2 {
            self.weights.fork_bonus * ai_threats
        } else {
            0
        };

        let fork_penalty = if opp_threats >= 2 {
            self.weights.fork_bonus * opp_threats
        } else {
            0
        };

        fork_bonus - fork_penalty
    }

    fn evaluate_next_board(&self, board: &Board, next_board: usize, opponent: Marker) -> i32 {
        if next_board >= MAX_BOARDS
            || !matches!(board.boards[next_board].status, Status::InProgress)
        {
            return 100;
        }

        let threat = self.evaluate_micro_board(&board.boards[next_board], opponent);
        -threat / self.weights.next_board_penalty
    }

    fn evaluate_micro_board(&self, board: &MacroBoard, ai_player: Marker) -> i32 {
        let opponent = !ai_player;
        let mut score = 0;
        let w = &self.weights;

        for line in &WINNING_LINES {
            let (ai_count, opp_count, empty_count) = self.count_micro_line(board, line, ai_player);

            if opp_count == 0 && ai_count > 0 {
                score += match (ai_count, empty_count) {
                    (2, 1) => w.micro_two_in_row,
                    (1, 2) => w.micro_one_in_row,
                    _ => 0,
                };
            }

            if ai_count == 0 && opp_count > 0 {
                score -= match (opp_count, empty_count) {
                    (2, 1) => w.micro_two_in_row,
                    (1, 2) => w.micro_one_in_row,
                    _ => 0,
                };
            }
        }

        match board.cells[4] {
            cell if cell == ai_player => score += w.micro_center,
            cell if cell == opponent => score -= w.micro_center,
            _ => {}
        }

        for &corner in &[0, 2, 6, 8] {
            match board.cells[corner] {
                cell if cell == ai_player => score += w.micro_corner,
                cell if cell == opponent => score -= w.micro_corner,
                _ => {}
            }
        }

        score
    }

    fn count_line_status(
        &self,
        board: &Board,
        line: &[usize; 3],
        ai_player: Marker,
    ) -> (i32, i32, i32) {
        let mut ai_won = 0;
        let mut opp_won = 0;
        let mut available = 0;

        for &pos in line {
            match board.boards[pos].status {
                Status::Won(winner) if winner == ai_player => ai_won += 1,
                Status::Won(_) => opp_won += 1,
                Status::InProgress => available += 1,
                _ => {}
            }
        }

        (ai_won, opp_won, available)
    }

    fn count_micro_line(
        &self,
        board: &MacroBoard,
        line: &[usize; 3],
        ai_player: Marker,
    ) -> (i32, i32, i32) {
        let opponent = !ai_player;
        let mut ai_count = 0;
        let mut opp_count = 0;
        let mut empty_count = 0;

        for &pos in line {
            match board.cells[pos] {
                cell if cell == ai_player => ai_count += 1,
                cell if cell == opponent => opp_count += 1,
                Marker::Empty => empty_count += 1,
                _ => {}
            }
        }

        (ai_count, opp_count, empty_count)
    }
}

pub struct MoveGenerator;

impl MoveGenerator {
    pub fn generate_moves(state: &GameState) -> Vec<Move> {
        let mut moves = Vec::with_capacity(MAX_CELLS);

        if let Some(board_idx) = state.next_board {
            if board_idx < MAX_BOARDS
                && matches!(state.board.boards[board_idx].status, Status::InProgress)
            {
                Self::add_board_moves(board_idx, &state.board.boards[board_idx], &mut moves);
            } else {
                Self::add_all_moves(&state.board, &mut moves);
            }
        } else {
            Self::add_all_moves(&state.board, &mut moves);
        }

        moves
    }

    pub fn count_moves(state: &GameState) -> usize {
        if let Some(board_idx) = state.next_board
            && board_idx < MAX_BOARDS
            && matches!(state.board.boards[board_idx].status, Status::InProgress)
        {
            return state.board.boards[board_idx]
                .cells
                .iter()
                .filter(|&&c| matches!(c, Marker::Empty))
                .count();
        }

        state
            .board
            .boards
            .iter()
            .filter(|b| matches!(b.status, Status::InProgress))
            .map(|b| {
                b.cells
                    .iter()
                    .filter(|&&c| matches!(c, Marker::Empty))
                    .count()
            })
            .sum()
    }

    pub fn generate_ordered_moves(
        state: &GameState,
        evaluator: &mut StateEvaluator,
        player: Marker,
        killers: Option<&KillerMoves>,
        current_depth: usize,
    ) -> Vec<Move> {
        let moves = Self::generate_moves(state);

        if moves.len() <= 1 {
            return moves;
        }

        let mut move_scores: Vec<(Move, i32)> = moves
            .iter()
            .map(|&mov| {
                let mut score = if let Some(k) = killers {
                    if k.is_killer(current_depth, mov) {
                        100000
                    } else {
                        0
                    }
                } else {
                    0
                };

                if score == 0 {
                    let mut new_state = state.clone();
                    GameStateManager::apply_move(&mut new_state, mov, player);
                    score = evaluator.evaluate(&new_state, player);
                }

                (mov, score)
            })
            .collect();

        move_scores.sort_by(|a, b| b.1.cmp(&a.1));
        move_scores.into_iter().map(|(mov, _)| mov).collect()
    }

    fn add_board_moves(board_idx: usize, board: &MacroBoard, moves: &mut Vec<Move>) {
        for cell_idx in 0..MAX_CELLS {
            if matches!(board.cells[cell_idx], Marker::Empty) {
                moves.push(Move::new(board_idx, cell_idx));
            }
        }
    }

    fn add_all_moves(board: &Board, moves: &mut Vec<Move>) {
        for board_idx in 0..MAX_BOARDS {
            if matches!(board.boards[board_idx].status, Status::InProgress) {
                Self::add_board_moves(board_idx, &board.boards[board_idx], moves);
            }
        }
    }
}

pub struct GameStateManager;

impl GameStateManager {
    pub fn apply_move(state: &mut GameState, mov: Move, player: Marker) {
        state.board.boards[mov.board_index].cells[mov.cell_index] = player;
        state.board.boards[mov.board_index].status =
            Self::check_board_status(&state.board.boards[mov.board_index]);

        state.last_move = Some([mov.board_index, mov.cell_index]);

        state.next_board = if matches!(
            state.board.boards[mov.cell_index].status,
            Status::InProgress
        ) {
            Some(mov.cell_index)
        } else {
            None
        };

        state.toggle_players();
        state.board.status = Self::check_overall_status(&state.board);
    }

    pub fn is_terminal(state: &GameState) -> bool {
        !matches!(state.board.status, Status::InProgress)
    }

    fn check_board_status(board: &MacroBoard) -> Status {
        for line in &WINNING_LINES {
            if !matches!(board.cells[line[0]], Marker::Empty)
                && board.cells[line[0]] == board.cells[line[1]]
                && board.cells[line[1]] == board.cells[line[2]]
            {
                return Status::Won(board.cells[line[0]]);
            }
        }

        if board
            .cells
            .iter()
            .all(|&cell| !matches!(cell, Marker::Empty))
        {
            return Status::Draw;
        }

        Status::InProgress
    }

    fn check_overall_status(board: &Board) -> Status {
        for line in &WINNING_LINES {
            if let (Status::Won(a), Status::Won(b), Status::Won(c)) = (
                &board.boards[line[0]].status,
                &board.boards[line[1]].status,
                &board.boards[line[2]].status,
            ) && a == b
                && b == c
            {
                return Status::Won(*a);
            }
        }

        if board
            .boards
            .iter()
            .all(|b| !matches!(b.status, Status::InProgress))
        {
            return Status::Draw;
        }

        Status::InProgress
    }
}

pub struct MinimaxAI {
    config: AIConfig,
    evaluator: StateEvaluator,
    killer_moves: KillerMoves,
    nodes_searched: usize,
}

impl MinimaxAI {
    pub fn with_level(level: u8) -> Result<Self, AppError> {
        let difficulty = DifficultyLevel::new(level)?;
        let config = AIConfig::from_level(difficulty);
        let evaluator = StateEvaluator::new(config.weights.clone());

        Ok(Self {
            config,
            evaluator,
            killer_moves: KillerMoves::new(),
            nodes_searched: 0,
        })
    }

    pub fn new(config: AIConfig) -> Self {
        let evaluator = StateEvaluator::new(config.weights.clone());
        Self {
            config,
            evaluator,
            killer_moves: KillerMoves::new(),
            nodes_searched: 0,
        }
    }

    pub fn nodes_searched(&self) -> usize {
        self.nodes_searched
    }

    pub fn find_best_move(&mut self, game_state: &GameState, player: Marker) -> Option<Move> {
        let start_time = Instant::now();
        self.nodes_searched = 0;

        if self.should_make_random_move() {
            return self.find_random_move(game_state);
        }

        let moves = if self.config.use_move_ordering {
            let killers = if self.config.use_killer_moves {
                Some(&self.killer_moves)
            } else {
                None
            };
            MoveGenerator::generate_ordered_moves(
                game_state,
                &mut self.evaluator,
                player,
                killers,
                self.config.max_depth,
            )
        } else {
            MoveGenerator::generate_moves(game_state)
        };

        if moves.is_empty() {
            return None;
        }

        if moves.len() == 1 {
            return Some(moves[0]);
        }

        let mut move_scores: Vec<(Move, i32)> = Vec::new();

        for mov in &moves {
            let mut new_state = game_state.clone();
            GameStateManager::apply_move(&mut new_state, *mov, player);

            let score = self.minimax(
                &new_state,
                self.config.max_depth - 1,
                false,
                player,
                i32::MIN,
                i32::MAX,
                start_time,
            );

            move_scores.push((*mov, score));
        }

        move_scores.sort_by(|a, b| b.1.cmp(&a.1));

        if self.should_make_mistake() {
            self.select_mistake_move(&move_scores)
        } else {
            Some(move_scores[0].0)
        }
    }

    #[allow(clippy::too_many_arguments)]
    fn minimax(
        &mut self,
        state: &GameState,
        depth: usize,
        is_maximizing: bool,
        ai_player: Marker,
        mut alpha: i32,
        mut beta: i32,
        start_time: Instant,
    ) -> i32 {
        self.nodes_searched += 1;

        if let Some(max_time) = self.config.max_time
            && start_time.elapsed() > max_time
        {
            return self.evaluator.evaluate(state, ai_player);
        }

        if depth == 0 || GameStateManager::is_terminal(state) {
            return self.evaluator.evaluate(state, ai_player);
        }

        let current_player = if is_maximizing { ai_player } else { !ai_player };

        let valid_moves = if self.config.use_move_ordering {
            let killers = if self.config.use_killer_moves {
                Some(&self.killer_moves)
            } else {
                None
            };
            MoveGenerator::generate_ordered_moves(
                state,
                &mut self.evaluator,
                current_player,
                killers,
                depth,
            )
        } else {
            MoveGenerator::generate_moves(state)
        };

        if valid_moves.is_empty() {
            return self.evaluator.evaluate(state, ai_player);
        }

        if is_maximizing {
            let mut max_eval = i32::MIN;
            let mut best_move = None;

            for mov in valid_moves {
                let mut new_state = state.clone();
                GameStateManager::apply_move(&mut new_state, mov, current_player);

                let eval = self.minimax(
                    &new_state,
                    depth - 1,
                    false,
                    ai_player,
                    alpha,
                    beta,
                    start_time,
                );

                if eval > max_eval {
                    max_eval = eval;
                    best_move = Some(mov);
                }
                alpha = max(alpha, eval);

                if beta <= alpha {
                    if self.config.use_killer_moves
                        && let Some(m) = best_move
                    {
                        self.killer_moves.add(depth, m);
                    }
                    break;
                }
            }
            max_eval
        } else {
            let mut min_eval = i32::MAX;
            let mut best_move = None;

            for mov in valid_moves {
                let mut new_state = state.clone();
                GameStateManager::apply_move(&mut new_state, mov, current_player);

                let eval = self.minimax(
                    &new_state,
                    depth - 1,
                    true,
                    ai_player,
                    alpha,
                    beta,
                    start_time,
                );

                if eval < min_eval {
                    min_eval = eval;
                    best_move = Some(mov);
                }
                beta = min(beta, eval);

                if beta <= alpha {
                    if self.config.use_killer_moves
                        && let Some(m) = best_move
                    {
                        self.killer_moves.add(depth, m);
                    }
                    break;
                }
            }
            min_eval
        }
    }

    fn should_make_random_move(&self) -> bool {
        self.config.random_move_chance > 0.0
            && rand::rng().random::<f64>() < self.config.random_move_chance
    }

    fn should_make_mistake(&self) -> bool {
        self.config.mistake_chance > 0.0 && rand::rng().random::<f64>() < self.config.mistake_chance
    }

    fn select_mistake_move(&self, move_scores: &[(Move, i32)]) -> Option<Move> {
        let pool_size = self.config.mistake_pool_size.min(move_scores.len());
        if pool_size <= 1 {
            return Some(move_scores[0].0);
        }

        let index = rand::rng().random_range(0..pool_size);
        Some(move_scores[index].0)
    }

    pub fn find_random_move(&self, game_state: &GameState) -> Option<Move> {
        let valid_moves = MoveGenerator::generate_moves(game_state);
        if valid_moves.is_empty() {
            return None;
        }

        let index = rand::rng().random_range(0..valid_moves.len());
        Some(valid_moves[index])
    }
}
