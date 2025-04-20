use anyhow::{Ok, Result};

use crate::utils::parse_tuple;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Player {
    X,
    O,
    None,
}

impl Default for Player {
    fn default() -> Self {
        Player::None
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SubBoardState {
    InProgress,
    Won(Player),
    Draw,
}

impl Default for SubBoardState {
    fn default() -> Self {
        SubBoardState::InProgress
    }
}

#[derive(Debug, Clone, Default)]
pub struct SubBoard {
    cells: [Option<Player>; 9],
    state: SubBoardState,
}

#[derive(Default, Clone)]
struct Board {
    boards: [SubBoard; 9],
}

#[derive(Default, Clone)]
pub struct Game {
    board: Board,
    current_player: Player,
}

impl Game {
    pub fn new() -> Self {
        Self {
            board: Board::default(),
            current_player: Player::X,
        }
    }

    pub fn update_game(&mut self, position_str: &str) -> Result<bool> {
        let position = parse_tuple(position_str).unwrap();
        if self.check_position(position) {
            if self.check_win(position.0) {
                return Ok(true);
            }
        }
        Ok(false)
    }
    fn check_position(&mut self, (a, b): (usize, usize)) -> bool {
        if self.board.boards[a].cells[b].is_none() {
            let _ = self.board.boards[a].cells[b].insert(self.current_player);
            if self.board.boards[a].cells.iter().all(|cell| cell.ne(&None)) {
                self.board.boards[a].state = SubBoardState::Draw;
            }
            true
        } else {
            false
        }
    }
    fn check_win(&mut self, index: usize) -> bool {
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
        for condition in win_conditions {
            let board = self.board.boards[index].clone();
            if board.cells[condition[0]].ne(&None)
                && board.cells[condition[0]].eq(&board.cells[condition[1]])
                && board.cells[condition[0]].eq(&board.cells[condition[2]])
            {
                self.board.boards[index].state = SubBoardState::Won(self.current_player);
            }
        }

        for condition in win_conditions {
            let boards = self.board.boards.clone();
            if boards[condition[0]]
                .state
                .eq(&SubBoardState::Won(self.current_player))
                && boards[condition[0]].state.eq(&boards[condition[1]].state)
                && boards[condition[0]].state.eq(&boards[condition[2]].state)
            {
                return true;
            }
        }
        false
    }
}
