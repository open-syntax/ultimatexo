use std::ops::Not;

use serde::{Deserialize, Serialize, Serializer};

use super::PlayerInfo;

#[derive(Debug, Clone, Copy, PartialEq, Deserialize, Eq)]
pub enum Marker {
    Empty,
    X,
    O,
}
impl Default for Marker {
    fn default() -> Self {
        Self::Empty
    }
}
impl Serialize for Marker {
    fn serialize<T>(&self, serializer: T) -> Result<T::Ok, T::Error>
    where
        T: Serializer,
    {
        match self {
            Marker::Empty => serializer.serialize_none(),
            Marker::X => serializer.serialize_char('X'),
            Marker::O => serializer.serialize_char('O'),
        }
    }
}

impl Not for Marker {
    type Output = Marker;

    fn not(self) -> Self::Output {
        match self {
            Marker::X => Marker::O,
            Marker::O => Marker::X,
            Marker::Empty => Marker::Empty,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Status {
    WaitingForPlayers,
    InProgress,
    Paused,
    Won(Marker),
    Draw,
}

impl Default for Status {
    fn default() -> Self {
        Status::InProgress
    }
}
impl Serialize for Status {
    fn serialize<T>(&self, serializer: T) -> Result<T::Ok, T::Error>
    where
        T: Serializer,
    {
        match self {
            Status::WaitingForPlayers => serializer.serialize_some("WaitingForPlayers"),
            Status::InProgress => serializer.serialize_none(),
            Status::Paused => serializer.serialize_some("Paused"),
            Status::Draw => serializer.serialize_some("Draw"),
            Status::Won(marker) => serializer.serialize_some(&marker),
        }
    }
}
#[derive(Debug, Default, Clone, Copy, Serialize)]
pub struct MacroBoard {
    pub cells: [Marker; 9],
    pub status: Status,
}

#[derive(Clone, Serialize, Debug)]
pub struct Board {
    pub boards: [MacroBoard; 9],
    pub status: Status,
}
impl Default for Board {
    fn default() -> Self {
        Self {
            boards: [MacroBoard::default(); 9],
            status: Status::WaitingForPlayers,
        }
    }
}
#[derive(Default, Clone, Debug)]
pub struct GameState {
    pub players: Vec<PlayerInfo>,
    pub board: Board,
    pub next_board: Option<usize>,
    pub mv: String,
}
impl GameState {
    pub fn toggle_players(&mut self) {
        let temp = self.players[0].clone();
        self.players[0] = self.players[1].clone();
        self.players[1] = temp;
    }
}
