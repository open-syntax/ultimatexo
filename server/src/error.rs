use axum::extract::rejection::{JsonRejection, PathRejection, QueryRejection};
use serde::Serialize;
use thiserror::Error;

#[derive(Error, Debug, Serialize, Clone)]
#[serde(tag = "type", content = "details")]
pub enum AppError {
    #[error("Game error: {0}")]
    Game(#[from] GameError),

    #[error("Room error: {0}")]
    Room(#[from] RoomError),

    #[error("Player error: {0}")]
    Player(#[from] PlayerError),

    #[error("Validation error: {0}")]
    Validation(#[from] ValidationError),

    #[error("Internal server error: {message}")]
    Internal {
        message: String,
        #[serde(skip)]
        error_source: Option<String>,
    },

    #[error("Bad request: {message}")]
    BadRequest { message: String },

    #[error("Forbidden: {message}")]
    Forbidden { message: String },

    #[error("Not found: {message}")]
    NotFound { message: String },

    #[error("Conflict: {message}")]
    Conflict { message: String },

    #[error("Payload too large: {message}")]
    PayloadTooLarge { message: String },

    #[error("Too many requests: {message}")]
    TooManyRequests {
        message: String,
        retry_after: Option<u64>,
    },
}

#[derive(Error, Debug, Clone, Serialize)]
pub enum GameError {
    #[error("Invalid move")]
    InvalidMove,

    #[error("Game has already ended")]
    AlreadyEnded,

    #[error("Game has not started yet")]
    NotStarted,

    #[error("Not player's turn")]
    NotPlayerTurn,
}

#[derive(Error, Debug, Clone, Serialize)]
pub enum RoomError {
    #[error("Room not found")]
    NotFound,

    #[error("Room is full")]
    Full,

    #[error("Invalid room password")]
    InvalidPassword,

    #[error("Access denied to room: {reason}")]
    AccessDenied { reason: String },

    #[error("Room creation failed: {reason}")]
    CreationFailed { reason: String },
}

#[derive(Error, Debug, Clone, Serialize)]
pub enum PlayerError {
    #[error("Player not found")]
    NotFound,
}

#[derive(Error, Debug, Clone, Serialize)]
pub enum ValidationError {
    #[error("Invalid format: {field} - {expected_format}")]
    InvalidFormat {
        field: String,
        expected_format: String,
    },
}

pub struct ErrorBuilder {
    error: AppError,
}

impl ErrorBuilder {
    pub fn new(error: AppError) -> Self {
        Self { error }
    }

    pub fn with_context(mut self, context: impl Into<String>) -> Self {
        match &mut self.error {
            AppError::Internal { message, .. } => {
                *message = format!("{}: {}", context.into(), message);
            }
            _ => {}
        }
        self
    }

    pub fn build(self) -> AppError {
        self.error
    }
}

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

    pub fn not_player_turn() -> Self {
        AppError::Game(GameError::NotPlayerTurn)
    }

    pub fn game_not_started() -> Self {
        AppError::Game(GameError::NotStarted)
    }

    pub fn internal_error(message: impl Into<String>) -> Self {
        AppError::Internal {
            message: message.into(),
            error_source: None,
        }
    }

    pub fn too_many_requests(message: impl Into<String>, retry_after: Option<u64>) -> Self {
        AppError::TooManyRequests {
            message: message.into(),
            retry_after,
        }
    }

    pub fn builder(self) -> ErrorBuilder {
        ErrorBuilder::new(self)
    }
}
impl From<tokio::time::error::Elapsed> for AppError {
    fn from(err: tokio::time::error::Elapsed) -> Self {
        AppError::Internal {
            message: "Operation timed out".to_string(),
            error_source: Some(err.to_string()),
        }
    }
}

impl From<serde_json::Error> for AppError {
    fn from(err: serde_json::Error) -> Self {
        AppError::BadRequest {
            message: format!("JSON parsing error: {}", err),
        }
    }
}

impl From<anyhow::Error> for AppError {
    fn from(err: anyhow::Error) -> Self {
        AppError::Internal {
            message: format!("Internal error: {}", err),
            error_source: Some(err.to_string()),
        }
    }
}

// Axum extraction rejections
impl From<JsonRejection> for AppError {
    fn from(rejection: JsonRejection) -> Self {
        match rejection {
            JsonRejection::JsonDataError(err) => AppError::BadRequest {
                message: format!("Invalid JSON data: {}", err),
            },
            JsonRejection::JsonSyntaxError(err) => AppError::BadRequest {
                message: format!("JSON syntax error: {}", err),
            },
            JsonRejection::MissingJsonContentType(_) => AppError::BadRequest {
                message: "Missing 'Content-Type: application/json' header".to_string(),
            },
            JsonRejection::BytesRejection(_) => AppError::BadRequest {
                message: "Failed to read request body".to_string(),
            },
            _ => AppError::BadRequest {
                message: "Invalid JSON request".to_string(),
            },
        }
    }
}

impl From<std::io::Error> for AppError {
    fn from(err: std::io::Error) -> Self {
        match err.kind() {
            std::io::ErrorKind::NotFound => AppError::NotFound {
                message: "Resource not found".to_string(),
            },
            std::io::ErrorKind::PermissionDenied => AppError::Forbidden {
                message: "Permission denied".to_string(),
            },
            std::io::ErrorKind::TimedOut => AppError::Internal {
                message: "Operation timed out".to_string(),
                error_source: Some(err.to_string()),
            },
            _ => AppError::Internal {
                message: format!("IO error: {}", err),
                error_source: Some(err.to_string()),
            },
        }
    }
}

impl From<std::env::VarError> for AppError {
    fn from(err: std::env::VarError) -> Self {
        AppError::Internal {
            message: format!("Environment variable error: {}", err),
            error_source: Some(err.to_string()),
        }
    }
}

// String parsing errors
impl From<std::num::ParseIntError> for AppError {
    fn from(err: std::num::ParseIntError) -> Self {
        AppError::Validation(ValidationError::InvalidFormat {
            field: "number".to_string(),
            expected_format: format!("valid integer, got parse error: {}", err),
        })
    }
}

impl From<std::num::ParseFloatError> for AppError {
    fn from(err: std::num::ParseFloatError) -> Self {
        AppError::Validation(ValidationError::InvalidFormat {
            field: "number".to_string(),
            expected_format: format!("valid float, got parse error: {}", err),
        })
    }
}

impl From<PathRejection> for AppError {
    fn from(rejection: PathRejection) -> Self {
        match rejection {
            PathRejection::FailedToDeserializePathParams(err) => AppError::BadRequest {
                message: format!("Invalid path parameters: {}", err),
            },
            PathRejection::MissingPathParams(err) => AppError::BadRequest {
                message: format!("Missing path parameters: {}", err),
            },
            _ => AppError::BadRequest {
                message: "Invalid path parameters".to_string(),
            },
        }
    }
}

impl From<QueryRejection> for AppError {
    fn from(rejection: QueryRejection) -> Self {
        match rejection {
            QueryRejection::FailedToDeserializeQueryString(err) => AppError::BadRequest {
                message: format!("Invalid query parameters: {}", err),
            },
            _ => AppError::BadRequest {
                message: "Invalid query parameters".to_string(),
            },
        }
    }
}

// WebSocket related errors (if using axum websockets)
impl From<axum::Error> for AppError {
    fn from(err: axum::Error) -> Self {
        AppError::Internal {
            message: format!("Axum error: {}", err),
            error_source: Some(err.to_string()),
        }
    }
}

// Tokio join error
impl From<tokio::task::JoinError> for AppError {
    fn from(err: tokio::task::JoinError) -> Self {
        AppError::Internal {
            message: format!("Task join error: {}", err),
            error_source: Some(err.to_string()),
        }
    }
}

pub trait ErrorContext<T> {
    fn with_context(self, context: impl Into<String>) -> Result<T, AppError>;
    fn with_internal_context(self, context: impl Into<String>) -> Result<T, AppError>;
}

impl<T, E> ErrorContext<T> for Result<T, E>
where
    E: Into<AppError>,
{
    fn with_context(self, context: impl Into<String>) -> Result<T, AppError> {
        self.map_err(|e| e.into().builder().with_context(context).build())
    }

    fn with_internal_context(self, context: impl Into<String>) -> Result<T, AppError> {
        self.map_err(|_| AppError::internal_error(context.into()))
    }
}
