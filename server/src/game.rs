use anyhow::{Error, Ok, Result};
use serde::{Deserialize, Serialize};

use crate::utils::parse_tuple;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
pub enum Marker {
    X,
    O,
}

impl ToString for Marker {
    fn to_string(&self) -> String {
        match self {
            Marker::X => "X".to_string(),
            Marker::O => "O".to_string(),
        }
    }
}

#[derive(Clone)]
pub struct Player {
    pub id: String,
    pub marker: Marker,
}
impl Player {
    fn new(id: String, marker: Marker) -> Self {
        Self { id, marker }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum SubBoardState {
    InProgress,
    Won(Marker),
    Draw,
}

impl Default for SubBoardState {
    fn default() -> Self {
        SubBoardState::InProgress
    }
}

#[derive(Debug, Clone, Default)]
struct SubBoard {
    cells: [Option<Marker>; 9],
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
    players: Vec<Player>,
    game_ended: bool,
    player_won: Option<Player>,
}

impl Game {
    pub fn new() -> Self {
        Self {
            board: Board::default(),
            current_player: None,
            players: Vec::new(),
            game_ended: false,
            player_won: None,
        }
    }
    pub fn add_player(&mut self, id: String, marker: Marker) -> Player {
        let player = Player::new(id, marker);
        if self.players.is_empty() {
            self.current_player = Some(player.clone());
        }
        self.players.push(player.clone());
        player
    }

    pub fn toggle_current_player(&mut self) {
        let current_idx = self
            .current_player
            .as_ref()
            .and_then(|p| self.players.iter().position(|pl| pl.id == p.id))
            .unwrap_or(0);
        let other_idx = 1 - current_idx;
        self.current_player = Some(self.players[other_idx].clone());
    }

    pub fn update_game(&mut self, position_str: &str) -> Result<usize> {
        let position = parse_tuple(position_str)?;
        self.check_position(position)?;
        self.check_win(position.0)?;
        self.toggle_current_player();
        if self.game_ended {
            if self.player_won.is_some() {
                return Ok(10);
            }
            return Ok(11);
        }
        Ok(position.1)
    }
    fn check_position(&mut self, (a, b): (usize, usize)) -> Result<bool> {
        if self.board.boards[a].cells[b].is_none() {
            let _ =
                self.board.boards[a].cells[b].insert(self.current_player.as_ref().unwrap().marker);
            if self.board.boards[a].cells.iter().all(|cell| cell.ne(&None)) {
                self.board.boards[a].state = SubBoardState::Draw;
            }
            return Ok(true);
        }
        Err(Error::msg("Invalid Move"))
    }
    fn check_win(&mut self, index: usize) -> Result<bool> {
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
        //checks of a win in current subboard
        for condition in win_conditions {
            let board = self.board.boards[index].clone();
            if board.cells[condition[0]].ne(&None)
                && board.cells[condition[0]].eq(&board.cells[condition[1]])
                && board.cells[condition[0]].eq(&board.cells[condition[2]])
            {
                self.board.boards[index].state =
                    SubBoardState::Won(self.current_player.as_ref().unwrap().marker);
            }
        }
        //checks of a game win
        for condition in win_conditions {
            let boards = self.board.boards.clone();
            if boards[condition[0]].state.eq(&SubBoardState::Won(
                self.current_player.as_ref().unwrap().marker,
            )) && boards[condition[0]].state.eq(&boards[condition[1]].state)
                && boards[condition[0]].state.eq(&boards[condition[2]].state)
            {
                self.game_ended = true;
                let _ = self.player_won.insert(self.current_player.take().unwrap());
            }
        }
        //checks for a game draw
        if self
            .board
            .boards
            .iter()
            .all(|board| board.state.ne(&SubBoardState::InProgress))
        {
            self.game_ended = true;
        }

        Ok(true)
    }
}
