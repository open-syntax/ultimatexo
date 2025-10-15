use super::{Board, PlayerInfo};
use crate::{error::AppError, models::Marker};
use anyhow::Result;
use serde::{Deserialize, Serialize};
use serde_json::to_string;
use utoipa::{IntoParams, ToSchema};

#[derive(Deserialize, Clone, Debug, ToSchema)]
pub enum ClientMessage {
    #[schema(title = "TextMessage")]
    TextMessage { content: String },
    #[schema(title = "GameUpdate")]
    GameUpdate { mv: [usize; 2] },
    #[schema(title = "RematchRequest")]
    RematchRequest { action: Action },
    #[schema(title = "DrawRequest")]
    DrawRequest { action: Action },
    #[schema(title = "Resign")]
    Resign,
    #[cfg(not(debug_assertions))]
    #[schema(title = "Pong")]
    Pong,
    #[serde(skip)]
    Close,
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
    #[schema(title = "TextMessage")]
    TextMessage { content: String, player: PlayerInfo },
    #[schema(title = "GameUpdate")]
    GameUpdate {
        board: Board,
        next_player: PlayerInfo,
        next_board: Option<usize>,
        last_move: Option<[usize; 2]>,
        score: [usize; 2],
    },
    #[schema(title = "PlayerUpdate")]
    PlayerUpdate {
        action: PlayerAction,
        player: SerizlizedPlayer,
    },
    #[schema(title = "RematchRequest")]
    RematchRequest { action: Action, player: Marker },
    #[schema(title = "DrawRequest")]
    DrawRequest { action: Action, player: Marker },
    #[serde(skip_serializing)]
    Close,
    #[cfg(not(debug_assertions))]
    #[schema(title = "Ping")]
    Ping,
    #[schema(title = "Error")]
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
