use crate::utils::parse_tuple;
use anyhow::{Ok, Result, anyhow};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

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

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct Player {
    pub id: String,
    pub marker: Marker,
}
impl Player {
    fn new(id: String, marker: Marker) -> Self {
        Self { id, marker }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
enum Status {
    InProgress,
    Won(Marker),
    Draw,
}

impl Default for Status {
    fn default() -> Self {
        Status::InProgress
    }
}
impl ToString for Status {
    fn to_string(&self) -> String {
        match self {
            Status::InProgress => "None".to_string(),
            Status::Draw => "Draw".to_string(),
            Status::Won(player) => player.to_string(),
        }
    }
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
struct SubBoard {
    cells: [Option<Marker>; 9],
    status: Status,
}

#[derive(Default, Clone, Serialize, Deserialize, Debug)]
pub struct Board {
    boards: [SubBoard; 9],
}

#[derive(Default, Clone, Debug)]
pub struct Game {
    board: Board,
    current_player: Option<Player>,
    next_player: Option<Player>,
    status: Status,
    next_board: Option<usize>,
}

impl Game {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn board(&self) -> Board {
        self.board.clone()
    }
    pub fn status(&self) -> String {
        self.status.to_string()
    }
    pub fn current_player(&self) -> Player {
        self.current_player.clone().unwrap()
    }

    pub fn next_player(&self) -> Player {
        self.next_player.clone().unwrap()
    }

    fn toggle_players(&mut self) {
        let temp = self.current_player.clone();
        self.current_player = self.next_player.clone();
        self.next_player = temp;
    }

    pub fn next_board(&self) -> String {
        self.next_board
            .map(|b| b.to_string())
            .unwrap_or_else(|| "null".to_string())
    }
    pub fn add_player(&mut self) -> Player {
        let mut player = Player::new(Uuid::new_v4().to_string(), Marker::X);
        if self.current_player.is_none() {
            self.current_player = Some(player.clone());
        } else {
            player.marker = Marker::O;
            self.next_player = Some(player.clone());
        }
        player
    }

    pub fn remove_player(&mut self, id: &String) -> Result<()> {
        if self.current_player().id == *id {
            self.current_player = None
        } else if self.next_player().id == *id {
            self.next_player = None
        } else {
            return Err(anyhow!("ID_DOESNT_EXIST"));
        }
        Ok(())
    }

    pub fn update_game(&mut self, position_str: &str, player_id: &str) -> Result<()> {
        if self.current_player().id.as_str() != player_id {
            return Err(anyhow!("ILLEGAL_TURN"));
        }
        let position = parse_tuple(position_str)?;
        self.check_position(position)?;
        self.check_win(position.0)?;
        self.toggle_players();
        Ok(())
    }
    fn check_position(&mut self, (a, b): (usize, usize)) -> Result<bool> {
        if self.current_player.is_none() || self.next_player.is_none() {
            return Err(anyhow!("MISSING_A_PLAYER"));
        }
        if self.next_board() == "null" || a.to_string() == self.next_board() {
            if self.board.boards[a].cells[b].is_none() {
                let _ = self.board.boards[a].cells[b].insert(self.next_player().marker);
                if self.board.boards[a].cells.iter().all(|cell| cell.ne(&None)) {
                    self.board.boards[a].status = Status::Draw;
                }
                self.next_board = Some(b);
                return Ok(true);
            }
        }

        Err(anyhow!("INVALID_MOVE"))
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
                self.board.boards[index].status = Status::Won(self.current_player().marker);
            }
        }
        //checks of a game win
        for condition in win_conditions {
            let boards = self.board.boards.clone();
            if boards[condition[0]]
                .status
                .eq(&Status::Won(self.current_player().marker))
                && boards[condition[0]].status.eq(&boards[condition[1]].status)
                && boards[condition[0]].status.eq(&boards[condition[2]].status)
            {
                self.status = Status::Won(self.current_player().marker);
            }
        }
        //checks for a game draw
        if self
            .board
            .boards
            .iter()
            .all(|board| board.status.ne(&Status::InProgress))
        {
            self.status = Status::Draw;
        }

        Ok(true)
    }

    // pub fn restart_game(&mut self) {
    //     *self = Self::default();
    //     self.player_won = None;
    // }
}
