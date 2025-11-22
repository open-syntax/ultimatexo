use rand::Rng;
use std::{
    cmp::{max, min},
    sync::{Arc, Mutex},
};
use ultimatexo_core::models::{Board, GameState, MacroBoard, Marker, Status};

#[derive(Debug, Clone, Copy, PartialEq)]
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

pub struct MinimaxAI {
    max_depth: usize,
}

impl MinimaxAI {
    pub fn new(depth: usize) -> Self {
        Self { max_depth: depth }
    }

    pub async fn find_random_move(&self, game_state: &GameState, _player: Marker) -> Option<Move> {
        let valid_moves = self.get_valid_moves(game_state);
        if valid_moves.is_empty() {
            return None;
        }

        let mut rng = rand::rng();
        let random_index = rng.random_range(0..valid_moves.len());
        Some(valid_moves[random_index])
    }

    pub async fn find_best_move_parallel(
        &self,
        game_state: &GameState,
        player: Marker,
    ) -> Option<Move> {
        let valid_moves = self.get_valid_moves(game_state);
        if valid_moves.is_empty() {
            return None;
        }

        if valid_moves.len() <= 4 {
            return self.find_best_move(game_state, player);
        }

        let game_state = Arc::new(game_state.clone());
        let best_move = Arc::new(Mutex::new((valid_moves[0], i32::MIN)));
        let mut handles = vec![];

        let chunk_size = (valid_moves.len() + 3).div_ceil(4);
        for chunk in valid_moves.chunks(chunk_size) {
            let chunk_moves = chunk.to_vec();
            let game_state_clone = Arc::clone(&game_state);
            let best_move_clone = Arc::clone(&best_move);
            let depth = self.max_depth;

            let handle = tokio::spawn(async move {
                let mut local_best_move = chunk_moves[0];
                let mut local_best_score = i32::MIN;

                for mov in chunk_moves {
                    let mut new_state = (*game_state_clone).clone();
                    let ai = MinimaxAI::new(depth);
                    ai.apply_move(&mut new_state, mov, player);

                    let score =
                        ai.minimax(&new_state, depth - 1, false, player, i32::MIN, i32::MAX);

                    if score > local_best_score {
                        local_best_score = score;
                        local_best_move = mov;
                    }
                }

                let mut global_best = best_move_clone.lock().unwrap();
                if local_best_score > global_best.1 {
                    *global_best = (local_best_move, local_best_score);
                }
            });

            handles.push(handle);
        }

        for handle in handles {
            handle.await.unwrap()
        }

        let result = best_move.lock().unwrap();
        Some(result.0)
    }

    pub fn find_best_move(&self, game_state: &GameState, player: Marker) -> Option<Move> {
        let valid_moves = self.get_valid_moves(game_state);
        if valid_moves.is_empty() {
            return None;
        }

        let mut best_move = valid_moves[0];
        let mut best_score = i32::MIN;

        for mov in valid_moves {
            let mut new_state = game_state.clone();
            self.apply_move(&mut new_state, mov, player);

            let score = self.minimax(
                &new_state,
                self.max_depth - 1,
                false,
                player,
                i32::MIN,
                i32::MAX,
            );

            if score > best_score {
                best_score = score;
                best_move = mov;
            }
        }

        Some(best_move)
    }

    fn minimax(
        &self,
        state: &GameState,
        depth: usize,
        is_maximizing: bool,
        ai_player: Marker,
        mut alpha: i32,
        mut beta: i32,
    ) -> i32 {
        if depth == 0 || self.is_game_over(state) {
            return self.evaluate_state(state, ai_player);
        }

        let current_player = if is_maximizing { ai_player } else { !ai_player };
        let valid_moves = self.get_valid_moves(state);

        if valid_moves.is_empty() {
            return self.evaluate_state(state, ai_player);
        }

        if is_maximizing {
            let mut max_eval = i32::MIN;
            for mov in valid_moves {
                let mut new_state = state.clone();
                self.apply_move(&mut new_state, mov, current_player);

                let eval = self.minimax(&new_state, depth - 1, false, ai_player, alpha, beta);
                max_eval = max(max_eval, eval);
                alpha = max(alpha, eval);

                if beta <= alpha {
                    break;
                }
            }
            max_eval
        } else {
            let mut min_eval = i32::MAX;
            for mov in valid_moves {
                let mut new_state = state.clone();
                self.apply_move(&mut new_state, mov, current_player);

                let eval = self.minimax(&new_state, depth - 1, true, ai_player, alpha, beta);
                min_eval = min(min_eval, eval);
                beta = min(beta, eval);

                if beta <= alpha {
                    break;
                }
            }
            min_eval
        }
    }

    fn get_valid_moves(&self, state: &GameState) -> Vec<Move> {
        let mut moves = Vec::new();

        if let Some(board_idx) = state.next_board {
            if board_idx < 9 && matches!(state.board.boards[board_idx].status, Status::InProgress) {
                for cell_idx in 0..9 {
                    if matches!(state.board.boards[board_idx].cells[cell_idx], Marker::Empty) {
                        moves.push(Move::new(board_idx, cell_idx));
                    }
                }
            } else {
                self.add_all_valid_moves(&state.board, &mut moves);
            }
        } else {
            self.add_all_valid_moves(&state.board, &mut moves);
        }

        moves
    }

    fn add_all_valid_moves(&self, board: &Board, moves: &mut Vec<Move>) {
        for board_idx in 0..9 {
            if matches!(board.boards[board_idx].status, Status::InProgress) {
                for cell_idx in 0..9 {
                    if matches!(board.boards[board_idx].cells[cell_idx], Marker::Empty) {
                        moves.push(Move::new(board_idx, cell_idx));
                    }
                }
            }
        }
    }

    pub fn apply_move(&self, state: &mut GameState, mov: Move, player: Marker) {
        state.board.boards[mov.board_index].cells[mov.cell_index] = player;

        state.board.boards[mov.board_index].status =
            self.check_board_status(&state.board.boards[mov.board_index]);

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

        state.board.status = self.check_overall_status(&state.board);
    }

    fn is_game_over(&self, state: &GameState) -> bool {
        !matches!(state.board.status, Status::InProgress)
    }

    fn evaluate_state(&self, state: &GameState, ai_player: Marker) -> i32 {
        let opponent = !ai_player;

        match state.board.status {
            Status::Won(winner) if winner == ai_player => return 1000,
            Status::Won(winner) if winner == opponent => return -1000,
            Status::Draw => return 0,
            _ => {}
        }

        let mut score = 0;

        for board in &state.board.boards {
            match board.status {
                Status::Won(winner) if winner == ai_player => score += 100,
                Status::Won(winner) if winner == opponent => score -= 100,
                Status::InProgress => {
                    score += self.evaluate_micro_board(board, ai_player);
                }
                _ => {}
            }
        }

        score += self.evaluate_macro_lines(&state.board, ai_player) * 10;

        score
    }

    fn evaluate_micro_board(&self, board: &MacroBoard, ai_player: Marker) -> i32 {
        let opponent = !ai_player;
        let mut score = 0;

        let lines = [
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],
            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8],
            [0, 4, 8],
            [2, 4, 6],
        ];

        for line in &lines {
            let mut ai_count = 0;
            let mut opponent_count = 0;

            for &pos in line {
                match board.cells[pos] {
                    Marker::X if ai_player == Marker::X => ai_count += 1,
                    Marker::O if ai_player == Marker::O => ai_count += 1,
                    Marker::X if opponent == Marker::X => opponent_count += 1,
                    Marker::O if opponent == Marker::O => opponent_count += 1,
                    _ => (),
                }
            }

            if opponent_count == 0 {
                score += match ai_count {
                    2 => 5,
                    1 => 1,
                    _ => 0,
                };
            }

            if ai_count == 0 {
                score -= match opponent_count {
                    2 => 5,
                    1 => 1,
                    _ => 0,
                };
            }
        }

        match board.cells[4] {
            Marker::X if ai_player == Marker::X => score += 2,
            Marker::O if ai_player == Marker::O => score += 2,
            Marker::X if opponent == Marker::X => score -= 2,
            Marker::O if opponent == Marker::O => score -= 2,
            _ => {}
        }

        score
    }

    fn evaluate_macro_lines(&self, board: &Board, ai_player: Marker) -> i32 {
        let opponent = !ai_player;
        let mut score = 0;

        let lines = [
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],
            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8],
            [0, 4, 8],
            [2, 4, 6],
        ];

        for line in &lines {
            let mut ai_won = 0;
            let mut opponent_won = 0;

            for &pos in line {
                match board.boards[pos].status {
                    Status::Won(winner) if winner == ai_player => ai_won += 1,
                    Status::Won(winner) if winner == opponent => opponent_won += 1,
                    _ => {}
                }
            }

            if opponent_won == 0 {
                score += match ai_won {
                    2 => 50,
                    1 => 5,
                    _ => 0,
                };
            }

            if ai_won == 0 {
                score -= match opponent_won {
                    2 => 50,
                    1 => 5,
                    _ => 0,
                };
            }
        }

        score
    }

    fn check_board_status(&self, board: &MacroBoard) -> Status {
        let lines = [
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],
            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8],
            [0, 4, 8],
            [2, 4, 6],
        ];

        for line in &lines {
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

    fn check_overall_status(&self, board: &Board) -> Status {
        let lines = [
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],
            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8],
            [0, 4, 8],
            [2, 4, 6],
        ];

        for line in &lines {
            let statuses = [
                &board.boards[line[0]].status,
                &board.boards[line[1]].status,
                &board.boards[line[2]].status,
            ];

            if let (Status::Won(a), Status::Won(b), Status::Won(c)) =
                (statuses[0], statuses[1], statuses[2])
                && a == b
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
