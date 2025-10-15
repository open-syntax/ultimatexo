use super::PlayerInfo;
use anyhow::Result;
use serde::{Deserialize, Serialize, Serializer};
use std::ops::Not;
use utoipa::ToSchema;

#[derive(Debug, Clone, Copy, PartialEq, Deserialize, Eq, ToSchema)]
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

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, ToSchema)]
pub enum Status {
    #[schema(title = "WaitingForPlayers")]
    WaitingForPlayers,
    #[schema(title = "InProgress")]
    #[default]
    InProgress,
    #[schema(title = "Paused")]
    Paused,
    #[schema(title = "Won")]
    Won(Marker),
    #[schema(title = "Draw")]
    Draw,
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
#[derive(Debug, Default, Clone, Copy, Serialize, ToSchema)]
pub struct MacroBoard {
    pub cells: [Marker; 9],
    pub status: Status,
}

#[derive(Clone, Serialize, Debug, ToSchema)]
pub struct Board {
    pub boards: [MacroBoard; 9],
    pub status: Status,
}
impl Default for Board {
    fn default() -> Self {
        Board {
            boards: [MacroBoard::default(); 9],
            status: Status::WaitingForPlayers,
        }
    }
}
#[derive(Clone, Debug)]
pub struct GameState {
    pub players: Vec<PlayerInfo>,
    pub current_index: usize,
    pub board: Board,
    pub next_board: Option<usize>,
    pub last_move: Option<[usize; 2]>,
    pub score: [usize; 2],
    pub pending_rematch: Option<String>,
    pub pending_draw: Option<String>,
    pub difficulty: u8,
}
impl GameState {
    pub fn new(
        difficulty: Option<u8>,
        players: Option<Vec<PlayerInfo>>,
        score: Option<[usize; 2]>,
    ) -> Self {
        Self {
            players: players.unwrap_or_default(),
            current_index: 0,
            board: Board::default(),
            next_board: None,
            last_move: None,
            score: score.unwrap_or([0, 0]),
            pending_rematch: None,
            pending_draw: None,
            difficulty: difficulty.unwrap_or_default(),
        }
    }
    pub fn toggle_players(&mut self) {
        self.current_index = 1 - self.current_index;
    }
}
