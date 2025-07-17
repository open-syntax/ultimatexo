use anyhow::Result;
use serde::{Deserialize, Serialize};
use serde_json::to_string;

use crate::error::AppError;

use super::{Board, Player, PlayerInfo};

#[derive(Deserialize, Clone, Debug)]
pub enum ClientMessage {
    TextMessage { content: String, player_id: String },
    GameUpdate { mv: String, player_id: String },
    GameRestart { action: RestartAction },
    Close(String),
    Pong(String),
}
#[derive(Serialize, Debug, Deserialize, Clone)]
pub enum RestartAction {
    Request,
    Accept,
    Reject,
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
        last_move: Option<(usize, usize)>,
    },
    PlayerUpdate {
        action: PlayerAction,
        player: Player,
    },
    GameRestart {
        action: RestartAction,
    },
    #[serde(skip_serializing)]
    Close,
    Ping,
    Pong,
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
