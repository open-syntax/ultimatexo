use axum::{
    Json,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use serde::{Deserialize, Serialize};
use serde_json::json;
use thiserror::Error;

#[derive(Error, Debug, Serialize, Clone, Deserialize)]
pub enum AppError {
    #[error("Game error: {0}")]
    Game(#[from] GameError),

    #[error("Room error: {0}")]
    Room(#[from] RoomError),

    #[error("Player error: {0}")]
    Player(#[from] PlayerError),

    #[error("Internal server error: {0}")]
    Internal(String),

    #[error("Bad request: {0}")]
    BadRequest(String),

    #[error("Unauthorized: {0}")]
    Unauthorized(String),

    #[error("Forbidden: {0}")]
    Forbidden(String),

    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Conflict: {0}")]
    Conflict(String),

    #[error("Payload too large: {0}")]
    PayloadTooLarge(String),

    #[error("Too many requests: {0}")]
    TooManyRequests(String),
}

#[derive(Error, Debug, Clone, Serialize, Deserialize)]
pub enum GameError {
    #[error("Invalid move")]
    InvalidMove,

    #[error("Game not found")]
    NotFound,

    #[error("Game already ended")]
    AlreadyEnded,

    #[error("Game not started")]
    NotStarted,

    #[error("Not player's turn")]
    NotPlayerTurn,
}

#[derive(Error, Debug, Clone, Serialize, Deserialize)]
pub enum RoomError {
    #[error("Room not found")]
    NotFound,

    #[error("Room is full")]
    Full,

    #[error("Invalid password")]
    InvalidPassword,

    #[error("Access denied")]
    AccessDenied,

    #[error("Room is private")]
    Private,
}

#[derive(Error, Debug, Clone, Serialize, Deserialize)]
pub enum PlayerError {
    #[error("Player not found")]
    NotFound,

    #[error("Player disconnected")]
    Disconnected,

    #[error("Player left")]
    Left,
}

impl AppError {
    pub fn error_code(&self) -> &'static str {
        match self {
            AppError::Game(e) => e.error_code(),
            AppError::Room(e) => e.error_code(),
            AppError::Player(e) => e.error_code(),
            AppError::Internal(_) => "INTERNAL_ERROR",
            AppError::BadRequest(_) => "BAD_REQUEST",
            AppError::Unauthorized(_) => "UNAUTHORIZED",
            AppError::Forbidden(_) => "FORBIDDEN",
            AppError::NotFound(_) => "NOT_FOUND",
            AppError::Conflict(_) => "CONFLICT",
            AppError::PayloadTooLarge(_) => "PAYLOAD_TOO_LARGE",
            AppError::TooManyRequests(_) => "TOO_MANY_REQUESTS",
        }
    }

    pub fn status_code(&self) -> StatusCode {
        match self {
            AppError::Game(GameError::NotFound) => StatusCode::NOT_FOUND,
            AppError::Game(GameError::InvalidMove) => StatusCode::BAD_REQUEST,
            AppError::Game(GameError::NotPlayerTurn) => StatusCode::FORBIDDEN,
            AppError::Game(_) => StatusCode::BAD_REQUEST,

            AppError::Room(RoomError::NotFound) => StatusCode::NOT_FOUND,
            AppError::Room(RoomError::Full) => StatusCode::CONFLICT,
            AppError::Room(RoomError::InvalidPassword) => StatusCode::UNAUTHORIZED,
            AppError::Room(RoomError::AccessDenied) => StatusCode::FORBIDDEN,
            AppError::Room(_) => StatusCode::BAD_REQUEST,

            AppError::Player(PlayerError::NotFound) => StatusCode::NOT_FOUND,
            AppError::Player(_) => StatusCode::BAD_REQUEST,

            AppError::Internal(_) => StatusCode::INTERNAL_SERVER_ERROR,
            AppError::BadRequest(_) => StatusCode::BAD_REQUEST,
            AppError::Unauthorized(_) => StatusCode::UNAUTHORIZED,
            AppError::Forbidden(_) => StatusCode::FORBIDDEN,
            AppError::NotFound(_) => StatusCode::NOT_FOUND,
            AppError::Conflict(_) => StatusCode::CONFLICT,
            AppError::PayloadTooLarge(_) => StatusCode::PAYLOAD_TOO_LARGE,
            AppError::TooManyRequests(_) => StatusCode::TOO_MANY_REQUESTS,
        }
    }
}

impl GameError {
    pub fn error_code(&self) -> &'static str {
        match self {
            GameError::InvalidMove => "INVALID_MOVE",
            GameError::NotFound => "GAME_NOT_FOUND",
            GameError::AlreadyEnded => "GAME_ALREADY_ENDED",
            GameError::NotStarted => "GAME_NOT_STARTED",
            GameError::NotPlayerTurn => "NOT_PLAYER_TURN",
        }
    }
}

impl RoomError {
    pub fn error_code(&self) -> &'static str {
        match self {
            RoomError::NotFound => "ROOM_NOT_FOUND",
            RoomError::Full => "ROOM_FULL",
            RoomError::InvalidPassword => "INVALID_PASSWORD",
            RoomError::AccessDenied => "ROOM_ACCESS_DENIED",
            RoomError::Private => "ROOM_PRIVATE",
        }
    }
}

impl PlayerError {
    pub fn error_code(&self) -> &'static str {
        match self {
            PlayerError::NotFound => "PLAYER_NOT_FOUND",
            PlayerError::Disconnected => "PLAYER_DISCONNECTED",
            PlayerError::Left => "PLAYER_LEFT",
        }
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let status = self.status_code();
        let error_code = self.error_code();
        let message = self.to_string();

        tracing::error!(
            error = %self,
            error_code = error_code,
            status_code = %status,
            "Request failed"
        );

        let body = Json(json!({
            "error": {
                "code": error_code,
                "message": message,
                "status": status.as_u16()
            }
        }));

        (status, body).into_response()
    }
}

// Helper functions for common error patterns
impl AppError {
    pub fn room_not_found() -> Self {
        AppError::Room(RoomError::NotFound)
    }

    pub fn room_full() -> Self {
        AppError::Room(RoomError::Full)
    }

    pub fn invalid_password() -> Self {
        AppError::Room(RoomError::InvalidPassword)
    }

    pub fn player_not_found() -> Self {
        AppError::Player(PlayerError::NotFound)
    }

    pub fn invalid_move() -> Self {
        AppError::Game(GameError::InvalidMove)
    }

    pub fn invalid_turn() -> Self {
        AppError::Game(GameError::NotPlayerTurn)
    }

    pub fn game_not_started() -> Self {
        AppError::Game(GameError::NotStarted)
    }

    pub fn internal_error(msg: impl Into<String>) -> Self {
        AppError::Internal(anyhow::anyhow!(msg.into()).to_string())
    }
}

impl From<tokio::time::error::Elapsed> for AppError {
    fn from(err: tokio::time::error::Elapsed) -> Self {
        AppError::Internal(anyhow::anyhow!("Operation timed out: {}", err).to_string())
    }
}

impl From<anyhow::Error> for AppError {
    fn from(err: anyhow::Error) -> Self {
        AppError::Internal(err.to_string())
    }
}

impl From<axum::Error> for AppError {
    fn from(err: axum::Error) -> Self {
        AppError::Internal(err.to_string())
    }
}

impl From<serde_json::Error> for AppError {
    fn from(err: serde_json::Error) -> Self {
        AppError::BadRequest(format!("Invalid JSON: {}", err))
    }
}

impl From<Box<dyn std::error::Error + Send + Sync>> for AppError {
    fn from(err: Box<dyn std::error::Error + Send + Sync>) -> Self {
        AppError::Internal(err.to_string())
    }
}
