use anyhow::{Error, Ok, Result};

use crate::utils::parse_tuple;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Player {
    X,
    O,
}

impl Player {
    pub fn next(&self) -> Player {
        match self {
            Player::X => Player::O,
            Player::O => Player::X,
        }
    }
}

impl ToString for Player {
    fn to_string(&self) -> String {
        match self {
            Player::X => "X".to_string(),
            Player::O => "O".to_string(),
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum SubBoardState {
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
struct SubBoard {
    cells: [Option<Player>; 9],
    state: SubBoardState,
}

#[derive(Default, Clone)]
pub struct Board {
    boards: [SubBoard; 9],
}

#[derive(Default, Clone)]
pub struct Game {
    pub board: Board,
    pub current_player: Option<Player>,
}

impl Game {
    pub fn new() -> Self {
        Self {
            board: Board::default(),
            current_player: Some(Player::X),
        }
    }

    pub fn update_game(&mut self, position_str: &str) -> Result<bool> {
        let position = parse_tuple(position_str).unwrap();
        let mut result = false;
        if self.check_position(position) {
            if self.check_win(position.0) {
                result = true;
            }
            let _ = self
                .current_player
                .insert(self.current_player.unwrap().next());
            return Ok(result);
        }
        Err(Error::msg("Invalid Move"))
    }
    fn check_position(&mut self, (a, b): (usize, usize)) -> bool {
        if self.board.boards[a].cells[b].is_none() {
            let _ = self.board.boards[a].cells[b].insert(self.current_player.unwrap_or(Player::X));
            if self.board.boards[a].cells.iter().all(|cell| cell.ne(&None)) {
                self.board.boards[a].state = SubBoardState::Draw;
            }
            return true;
        }
        false
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
                self.board.boards[index].state = SubBoardState::Won(self.current_player.unwrap());
            }
        }

        for condition in win_conditions {
            let boards = self.board.boards.clone();
            if boards[condition[0]]
                .state
                .eq(&SubBoardState::Won(self.current_player.unwrap()))
                && boards[condition[0]].state.eq(&boards[condition[1]].state)
                && boards[condition[0]].state.eq(&boards[condition[2]].state)
            {
                return true;
            }
        }
        false
    }
}
