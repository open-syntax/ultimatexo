use axum::{
    Json,
    extract::rejection::{JsonRejection, PathRejection, QueryRejection},
    http::StatusCode,
    response::{IntoResponse, Response},
};
use serde::Serialize;
use serde_json::json;
use thiserror::Error;
use tracing::{error, warn};

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

    #[error("Unauthorized: {message}")]
    Unauthorized { message: String },

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
    #[error("Room not found with ID: {room_id}")]
    NotFound { room_id: String },

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
    #[error("Player not found with ID: {player_id}")]
    NotFound { player_id: String },
}

#[derive(Error, Debug, Clone, Serialize)]
pub enum ValidationError {
    #[error("Invalid format: {field} - {expected_format}")]
    InvalidFormat {
        field: String,
        expected_format: String,
    },
}

#[derive(Debug, Clone, Copy, Serialize)]
pub enum ErrorSeverity {
    Low,
    Medium,
    High,
    Critical,
}

impl AppError {
    pub fn error_code(&self) -> &'static str {
        match self {
            AppError::Game(e) => e.error_code(),
            AppError::Room(e) => e.error_code(),
            AppError::Player(e) => e.error_code(),
            AppError::Validation(e) => e.error_code(),
            AppError::Internal { .. } => "INTERNAL_ERROR",
            AppError::BadRequest { .. } => "BAD_REQUEST",
            AppError::Unauthorized { .. } => "UNAUTHORIZED",
            AppError::Forbidden { .. } => "FORBIDDEN",
            AppError::NotFound { .. } => "NOT_FOUND",
            AppError::Conflict { .. } => "CONFLICT",
            AppError::PayloadTooLarge { .. } => "PAYLOAD_TOO_LARGE",
            AppError::TooManyRequests { .. } => "TOO_MANY_REQUESTS",
        }
    }

    /// Get the HTTP status code for this error
    pub fn status_code(&self) -> StatusCode {
        match self {
            AppError::Game(e) => e.status_code(),
            AppError::Room(e) => e.status_code(),
            AppError::Player(e) => e.status_code(),
            AppError::Validation(_) => StatusCode::BAD_REQUEST,
            AppError::Internal { .. } => StatusCode::INTERNAL_SERVER_ERROR,
            AppError::BadRequest { .. } => StatusCode::BAD_REQUEST,
            AppError::Unauthorized { .. } => StatusCode::UNAUTHORIZED,
            AppError::Forbidden { .. } => StatusCode::FORBIDDEN,
            AppError::NotFound { .. } => StatusCode::NOT_FOUND,
            AppError::Conflict { .. } => StatusCode::CONFLICT,
            AppError::PayloadTooLarge { .. } => StatusCode::PAYLOAD_TOO_LARGE,
            AppError::TooManyRequests { .. } => StatusCode::TOO_MANY_REQUESTS,
        }
    }

    /// Get the severity level for logging and monitoring
    pub fn severity(&self) -> ErrorSeverity {
        match self {
            AppError::Game(_) | AppError::Player(_) | AppError::Validation(_) => ErrorSeverity::Low,
            AppError::Room(_) | AppError::NotFound { .. } | AppError::BadRequest { .. } => {
                ErrorSeverity::Low
            }
            AppError::Unauthorized { .. } | AppError::Forbidden { .. } => ErrorSeverity::Medium,
            AppError::Conflict { .. } | AppError::PayloadTooLarge { .. } => ErrorSeverity::Medium,
            AppError::TooManyRequests { .. } => ErrorSeverity::Medium,
            AppError::Internal { .. } => ErrorSeverity::High,
        }
    }

    /// Check if this error should be retryable
    pub fn is_retryable(&self) -> bool {
        matches!(
            self,
            AppError::Internal { .. } | AppError::TooManyRequests { .. }
        )
    }

    /// Get retry delay in seconds if applicable
    pub fn retry_after(&self) -> Option<u64> {
        match self {
            AppError::TooManyRequests { retry_after, .. } => *retry_after,
            _ => None,
        }
    }
}

impl GameError {
    pub fn error_code(&self) -> &'static str {
        match self {
            GameError::InvalidMove { .. } => "INVALID_MOVE",
            GameError::AlreadyEnded => "GAME_ALREADY_ENDED",
            GameError::NotStarted => "GAME_NOT_STARTED",
            GameError::NotPlayerTurn { .. } => "NOT_PLAYER_TURN",
        }
    }

    pub fn status_code(&self) -> StatusCode {
        match self {
            GameError::InvalidMove { .. } => StatusCode::BAD_REQUEST,
            GameError::NotPlayerTurn { .. } => StatusCode::FORBIDDEN,
            GameError::AlreadyEnded | GameError::NotStarted => StatusCode::CONFLICT,
        }
    }
}

impl RoomError {
    pub fn error_code(&self) -> &'static str {
        match self {
            RoomError::NotFound { .. } => "ROOM_NOT_FOUND",
            RoomError::Full { .. } => "ROOM_FULL",
            RoomError::InvalidPassword => "INVALID_PASSWORD",
            RoomError::AccessDenied { .. } => "ROOM_ACCESS_DENIED",
            RoomError::CreationFailed { .. } => "ROOM_CREATION_FAILED",
        }
    }

    pub fn status_code(&self) -> StatusCode {
        match self {
            RoomError::NotFound { .. } => StatusCode::NOT_FOUND,
            RoomError::Full { .. } => StatusCode::CONFLICT,
            RoomError::InvalidPassword => StatusCode::UNAUTHORIZED,
            RoomError::AccessDenied { .. } => StatusCode::FORBIDDEN,
            RoomError::CreationFailed { .. } => StatusCode::BAD_REQUEST,
        }
    }
}

impl PlayerError {
    pub fn error_code(&self) -> &'static str {
        match self {
            PlayerError::NotFound { .. } => "PLAYER_NOT_FOUND",
        }
    }

    pub fn status_code(&self) -> StatusCode {
        match self {
            PlayerError::NotFound { .. } => StatusCode::NOT_FOUND,
        }
    }
}

impl ValidationError {
    pub fn error_code(&self) -> &'static str {
        match self {
            ValidationError::InvalidFormat { .. } => "INVALID_FORMAT",
        }
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let status = self.status_code();
        let error_code = self.error_code();
        let message = self.to_string();
        let severity = self.severity();
        let is_retryable = self.is_retryable();

        // Log based on severity
        match severity {
            ErrorSeverity::Low => {
                warn!(
                    error = %self,
                    error_code = error_code,
                    status_code = %status,
                    "Request failed with low severity"
                );
            }
            ErrorSeverity::Medium | ErrorSeverity::High | ErrorSeverity::Critical => {
                error!(
                    error = %self,
                    error_code = error_code,
                    status_code = %status,
                    severity = ?severity,
                    "Request failed"
                );
            }
        }

        let mut response_body = json!({
            "error": {
                "code": error_code,
                "message": message,
                "status": status.as_u16(),
                "retryable": is_retryable,
            }
        });

        if let Some(retry_after) = self.retry_after() {
            response_body["error"]["retry_after"] = json!(retry_after);
        }

        let mut response = (status, Json(response_body)).into_response();

        // Add Retry-After header for rate limiting
        if let Some(retry_after) = self.retry_after() {
            response
                .headers_mut()
                .insert("Retry-After", retry_after.to_string().parse().unwrap());
        }

        response
    }
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
    pub fn room_not_found(room_id: impl Into<String>) -> Self {
        AppError::Room(RoomError::NotFound {
            room_id: room_id.into(),
        })
    }

    pub fn room_full() -> Self {
        AppError::Room(RoomError::Full)
    }

    pub fn invalid_password() -> Self {
        AppError::Room(RoomError::InvalidPassword)
    }

    pub fn player_not_found(player_id: impl Into<String>) -> Self {
        AppError::Player(PlayerError::NotFound {
            player_id: player_id.into(),
        })
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
