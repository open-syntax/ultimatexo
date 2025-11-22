use super::{Board, PlayerInfo};
use crate::{error::AppError, models::Marker};
use anyhow::Result;
use axum::extract::ws::Message;
use serde::{Deserialize, Serialize};
use serde_json::to_string;
use utoipa::{IntoParams, ToSchema};

#[derive(Deserialize, Clone, Debug, ToSchema)]
pub enum ClientMessage {
    TextMessage {
        content: String,
    },
    GameUpdate {
        mv: [usize; 2],
    },
    RematchRequest {
        action: Action,
    },
    DrawRequest {
        action: Action,
    },
    Resign,
    #[cfg(not(debug_assertions))]
    Pong,
}
#[derive(Serialize, Debug, Deserialize, Clone, ToSchema)]
pub enum Action {
    Request,
    Accept,
    Decline,
}

#[derive(Debug, Deserialize, ToSchema, IntoParams)]
pub struct WebSocketQuery {
    pub password: Option<String>,
    #[serde(default)]
    pub is_reconnecting: bool,
    pub player_id: Option<String>,
}

#[derive(Deserialize, ToSchema)]
pub struct GetRoomQuery {
    pub name: Option<String>,
}

#[derive(Serialize, Debug, Clone, ToSchema)]
pub struct SerizlizedPlayer {
    pub marker: Marker,
    pub id: Option<String>,
}

impl SerizlizedPlayer {
    pub fn new(marker: Marker, id: Option<String>) -> Self {
        Self { marker, id }
    }
}

#[derive(Serialize, Debug, Clone, ToSchema)]
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
        score: [usize; 2],
    },
    PlayerUpdate {
        action: PlayerAction,
        player: SerizlizedPlayer,
    },
    RematchRequest {
        action: Action,
        player: Marker,
    },
    DrawRequest {
        action: Action,
        player: Marker,
    },
    #[serde(skip_serializing)]
    WebsocketMessage(Message),
    #[cfg(not(debug_assertions))]
    Ping,
    Error(AppError),
}
impl ServerMessage {
    pub fn to_json(&self) -> Result<String> {
        Ok(to_string(self)?)
    }
}

#[derive(Serialize, Clone, Debug, ToSchema)]
pub enum PlayerAction {
    Joined,
    Left,
    Disconnected,
    Reconnected,
}
