use anyhow::Result;
use serde::{Deserialize, Serialize};
use serde_json::to_string;

use crate::{error::AppError, models::Marker};

use super::{Board, Player, PlayerInfo};

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
    pub player_id: Option<String>,
}

#[derive(Deserialize)]
pub struct RoomNameQuery {
    pub name: Option<String>,
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
        player: Player,
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
    PlayerJoined,
    PlayerLeft,
    PlayerDisconnected,
    PlayerReconnected,
}
