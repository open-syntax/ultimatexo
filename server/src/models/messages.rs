use super::{Board, PlayerInfo};
use crate::{error::AppError, models::Marker};
use anyhow::Result;
use serde::{Deserialize, Serialize};
use serde_json::to_string;

#[derive(Deserialize, Clone, Debug)]
pub enum ClientMessage {
    TextMessage { content: String },
    GameUpdate { mv: [usize; 2] },
    GameRestart { action: Action },
    DrawRequest { action: Action },
    Resign,
    Pong,
    Close,
}
#[derive(Serialize, Debug, Deserialize, Clone)]
pub enum Action {
    Request,
    Accept,
    Decline,
}

#[derive(Debug, Deserialize)]
pub struct WebSocketQuery {
    pub password: Option<String>,
    #[serde(default)]
    pub is_reconnecting: bool,
    pub player_id: Option<String>,
}

#[derive(Deserialize)]
pub struct RoomNameQuery {
    pub name: Option<String>,
}

#[derive(Serialize, Debug, Clone)]
pub struct SerizlizedPlayer {
    pub marker: Marker,
    pub id: Option<String>,
}

impl SerizlizedPlayer {
    pub fn new(marker: Marker, id: Option<String>) -> Self {
        Self { marker, id }
    }
}

#[derive(Serialize, Debug, Clone)]
#[serde(tag = "event", content = "data")]
pub enum ServerMessage {
    TextMessage {
        content: String,
        player: PlayerInfo,
    },
    GameUpdate {
        board: Board,
        next_player: PlayerInfo,
        next_board: Option<usize>,
        last_move: Option<[usize; 2]>,
    }, 
    PlayerUpdate {
        action: PlayerAction,
        player: SerizlizedPlayer,
    },
    GameRestart {
        action: Action,
        player: Marker,
    },
    DrawRequest {
        action: Action,
        player: Marker,
    },
    #[serde(skip_serializing)]
    Close,
    Ping,
    Error(AppError),
}
impl ServerMessage {
    pub fn to_json(&self) -> Result<String> {
        Ok(to_string(self)?)
    }
}

#[derive(Serialize, Clone, Debug)]
pub enum PlayerAction {
    Joined,
    Left,
    Disconnected,
    Reconnected,
}
