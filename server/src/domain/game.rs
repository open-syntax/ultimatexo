use crate::{
    ai::{MinimaxAI, Move},
    error::AppError,
    models::{Board, GameState, Marker, PlayerInfo, Status},
};
use anyhow::Result;
use rand::Rng;

#[derive(Debug)]
pub struct GameEngine {
    pub state: GameState,
}

impl GameEngine {
    pub fn new(difficulty: Option<u8>) -> Self {
        Self {
            state: GameState::new(difficulty, None),
        }
    }
    pub fn make_move(&mut self, mv: [usize; 2]) -> Result<(), AppError> {
        self.validate_move(mv)?;
        self.apply_move(mv)?;
        self.update_game_state(mv)?;
        self.state.toggle_players();
        Ok(())
    }

    fn validate_move(&self, mv: [usize; 2]) -> Result<(), AppError> {
        let a = mv[0];
        let b = mv[1];
        if self.state.board.status != Status::InProgress {
            return Err(AppError::game_not_started());
        }

        if a >= 9 || b >= 9 {
            return Err(AppError::invalid_move());
        }

        let target_board = &self.state.board.boards[a];

        if let Some(required_board) = self.state.next_board
            && required_board != a
        {
            return Err(AppError::invalid_move());
        }

        if target_board.status != Status::InProgress {
            return Err(AppError::invalid_move());
        }

        if target_board.cells[b] != Marker::Empty {
            return Err(AppError::invalid_move());
        }

        Ok(())
    }

    fn apply_move(&mut self, mv: [usize; 2]) -> Result<(), AppError> {
        self.state.board.boards[mv[0]].cells[mv[1]] =
            self.state.players[self.state.current_index].marker;
        Ok(())
    }

    fn update_game_state(&mut self, mv: [usize; 2]) -> Result<(), AppError> {
        self.check_board_win(mv[0])?;
        self.check_game_win()?;
        self.update_next_board(mv[1]);
        self.update_last_move(mv);
        Ok(())
    }

    fn check_board_win(&mut self, board_idx: usize) -> Result<(), AppError> {
        let win_conditions = [
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],
            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8],
            [0, 4, 8],
            [2, 4, 6],
        ];

        let board = &mut self.state.board.boards[board_idx];

        // Check for win
        for condition in win_conditions {
            if board.cells[condition[0]] != Marker::Empty
                && board.cells[condition[0]] == board.cells[condition[1]]
                && board.cells[condition[0]] == board.cells[condition[2]]
            {
                board.status = Status::Won(board.cells[condition[0]]);
                return Ok(());
            }
        }

        // Check for draw
        if board.cells.iter().all(|&cell| cell != Marker::Empty) {
            board.status = Status::Draw;
        }

        Ok(())
    }

    fn check_game_win(&mut self) -> Result<(), AppError> {
        let win_conditions = [
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],
            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8],
            [0, 4, 8],
            [2, 4, 6],
        ];

        let current_player_marker = self.state.players[self.state.current_index].marker;

        for condition in win_conditions {
            if self.state.board.boards[condition[0]].status == Status::Won(current_player_marker)
                && self.state.board.boards[condition[1]].status
                    == Status::Won(current_player_marker)
                && self.state.board.boards[condition[2]].status
                    == Status::Won(current_player_marker)
            {
                if current_player_marker == Marker::X {
                    self.state.board.status = Status::Won(Marker::X);
                    self.state.score[0] += 1;
                } else {
                    self.state.board.status = Status::Won(Marker::O);
                    self.state.score[1] += 1;
                }
                return Ok(());
            }
        }

        // Check for game draw
        if self
            .state
            .board
            .boards
            .iter()
            .all(|board| board.status != Status::InProgress)
        {
            self.state.board.status = Status::Draw;
        }

        Ok(())
    }

    fn update_next_board(&mut self, target_board: usize) {
        if self.state.board.boards[target_board].status == Status::InProgress {
            self.state.next_board = Some(target_board);
        } else {
            self.state.next_board = None;
        }
    }
    fn update_last_move(&mut self, mv: [usize; 2]) {
        self.state.last_move = Some(mv);
    }

    pub fn get_current_player(&self) -> PlayerInfo {
        self.state.players[self.state.current_index].clone()
    }

    pub fn get_board_status(&self) -> Status {
        self.state.board.status
    }

    pub fn set_board_status(&mut self, status: Status) {
        self.state.board.status = status;
    }

    pub fn push_player(&mut self, player: PlayerInfo) {
        let marker = player.marker;
        self.state.players.push(player);
        if self.state.players.len() == 2 && marker == Marker::X {
            self.state.toggle_players();
        }
    }

    pub fn get_board(&self) -> Board {
        self.state.board.clone()
    }

    pub fn get_next_player(&self) -> PlayerInfo {
        self.state.players[self.state.current_index].clone()
    }

    pub fn get_next_board(&self) -> Option<usize> {
        self.state.next_board
    }

    pub fn get_last_move(&self) -> Option<[usize; 2]> {
        self.state.last_move
    }

    pub fn get_score(&self) -> [usize; 2] {
        self.state.score
    }

    pub fn increase_score(&mut self, index: usize) {
        self.state.score[index] += 1;
    }

    pub fn has_pending_rematch(&self) -> bool {
        self.state.pending_rematch.is_some()
    }

    pub fn is_pending_rematch_from(&self, id: &str) -> bool {
        self.state.pending_rematch.as_deref() == Some(id)
    }

    pub fn request_rematch(&mut self, id: String) {
        self.state.pending_rematch = Some(id);
    }

    pub fn clear_rematch_request(&mut self) {
        self.state.pending_rematch = None;
    }

    pub fn has_pending_draw(&self) -> bool {
        self.state.pending_draw.is_some()
    }

    pub fn is_pending_draw_from(&self, id: &str) -> bool {
        self.state.pending_draw.as_deref() == Some(id)
    }

    pub fn request_draw(&mut self, id: String) {
        self.state.pending_draw = Some(id);
    }

    pub fn clear_draw_request(&mut self) {
        self.state.pending_draw = None;
    }

    async fn get_ai_move(&self, ai_player: Marker) -> Option<Move> {
        let ai = MinimaxAI::new(self.state.difficulty.min(5) as usize);
        ai.find_best_move_parallel(&self.state, ai_player).await
    }

    pub async fn apply_ai_move(&mut self, ai_player: Marker) -> Result<(), AppError> {
        if let Some(ai_move) = self.get_ai_move(ai_player).await
            && self
                .make_move([ai_move.board_index, ai_move.cell_index])
                .is_ok()
        {
            return Ok(());
        }
        Err(AppError::ai_move_failed())
    }

    pub fn play_random_move(&mut self) {
        let mut rng = rand::rng();
        let mv: [usize; 2] = [rng.random_range(0..9), rng.random_range(0..9)];
        self.make_move(mv).unwrap();
    }

    pub fn rematch_game(&mut self, difficulty: Option<u8>) {
        let players = self.state.players.clone();
        self.state = GameState::new(difficulty, Some(players));
    }
}
