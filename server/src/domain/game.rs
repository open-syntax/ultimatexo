use crate::ai::evaluation::Evaluator;
use crate::error::AppError;
use crate::models::room::BotLevel;
use crate::models::{GameState, Marker, Status};
use anyhow::Result;

#[derive(Debug)]
pub struct GameEngine {
    pub state: GameState,
}

impl GameEngine {
    pub fn new() -> Self {
        Self {
            state: GameState::default(),
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

        if let Some(required_board) = self.state.next_board {
            if required_board != a {
                return Err(AppError::invalid_move());
            }
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
        self.state.board.boards[mv[0]].cells[mv[1]] = self.state.players[0].marker;
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

        let current_player_marker = self.state.players[0].marker;

        for condition in win_conditions {
            if self.state.board.boards[condition[0]].status == Status::Won(current_player_marker)
                && self.state.board.boards[condition[1]].status
                    == Status::Won(current_player_marker)
                && self.state.board.boards[condition[2]].status
                    == Status::Won(current_player_marker)
            {
                self.state.board.status = Status::Won(current_player_marker);
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

    pub async fn generate_move(&mut self, level: BotLevel) -> Result<(), AppError> {
        // use minimax::Strategy;
        // let mut strategy = minimax::Negamax::new(Evaluator, level);
        // if let Some(best_move) = strategy.choose_move(&self.state) {
        //     self.make_move([best_move.board, best_move.cell])?;
        // }
        Ok(())
    }

    pub fn rematch_game(&mut self) {
        self.state = GameState::default();
    }
}
