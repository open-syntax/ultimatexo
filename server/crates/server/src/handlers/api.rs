use crate::{
    app::AppState,
    utils::{otel::hash_ip, real_ip::real_client_ip},
};
use axum::{
    Json,
    extract::{ConnectInfo, Path, Query, State},
    http::{HeaderMap, HeaderValue, StatusCode},
};
use serde_json::{Value, json};
use std::{net::SocketAddr, sync::Arc};
use tracing::{info, warn};
use ultimatexo_core::{BotLevel, GetRoomQuery, RoomInfo, RoomType};

#[utoipa::path(
    get,
    path = "/rooms",
    params(
        ("name" = Option<String>, Query, description = "Optional room name filter")
    ),
    responses(
        (status = 200, description = "List of rooms retrieved successfully", body = Vec<RoomInfo>),
    ),
    tag = "rooms"
)]
pub async fn get_rooms(
    State(state): State<Arc<AppState>>,
    Query(GetRoomQuery { name }): Query<GetRoomQuery>,
) -> Result<(HeaderMap, Json<Vec<RoomInfo>>), StatusCode> {
    let rooms = state.get_public_rooms(name.as_deref()).await;
    let mut headers = HeaderMap::new();
    headers.insert(
        "Cache-Control",
        HeaderValue::from_static("no-store, no-cache, must-revalidate"),
    );
    headers.insert("Pragma", HeaderValue::from_static("no-cache"));
    Ok((headers, Json(rooms)))
}

#[utoipa::path(
    get,
    path = "/room/{room_id}",
    params(
        ("room_id" = String, Path, description = "The unique identifier of the room")
    ),
    responses(
        (status = 200, description = "Room found", body = RoomInfo),
        (status = 404, description = "Room not found")
    ),
    tag = "rooms"
)]
pub async fn get_room(
    State(state): State<Arc<AppState>>,
    Path(room_id): Path<String>,
) -> Result<Json<RoomInfo>, StatusCode> {
    state
        .get_room_info(&room_id)
        .await
        .map(Json)
        .ok_or(StatusCode::NOT_FOUND)
}

#[utoipa::path(
    post,
    path = "/rooms",
    request_body = RoomInfo,
    responses(
        (status = 200, description = "Room created successfully", body = inline(Object), example = json!({"room_id": "123567"})),
        (status = 400, description = "Bad request", body = inline(Object), example = json!({"message": "Expert bot is currently disabled"})),
        (status = 500, description = "Internal server error")
    ),
    tag = "rooms"
)]
pub async fn create_room(
    headers: HeaderMap,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    State(state): State<Arc<AppState>>,
    Json(room_info): Json<RoomInfo>,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let client_ip = real_client_ip(&headers, addr);
    let client_hash = hash_ip(&client_ip);

    if room_info.room_type == RoomType::BotRoom
        && let Some(BotLevel::Expert) = room_info.bot_level
    {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(json!({
                "message": "Expert bot is currently disabled."
            })),
        ));
    }

    match state.create_room(room_info).await {
        Ok(room_id) => {
            info!(
                client_hash = %client_hash,
                room_id = %room_id,
                "room_created"
            );
            Ok(Json(json!({ "room_id": room_id })))
        }
        Err(_) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "message": "Failed to create room. Please try again." })),
        )),
    }
}

#[derive(Debug, serde::Deserialize)]
pub struct ClientErrorPayload {
    pub message: String,
    pub stack: Option<String>,
    pub url: String,
}

const MAX_ERROR_MESSAGE_LEN: usize = 4096;
const MAX_ERROR_STACK_LEN: usize = 4096;
const MAX_ERROR_URL_LEN: usize = 2048;

pub async fn client_error(
    headers: HeaderMap,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    Json(payload): Json<ClientErrorPayload>,
) -> Result<StatusCode, (StatusCode, Json<Value>)> {
    if payload.message.len() > MAX_ERROR_MESSAGE_LEN {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(json!({ "error": "message exceeds maximum length" })),
        ));
    }
    if payload
        .stack
        .as_ref()
        .is_some_and(|s| s.len() > MAX_ERROR_STACK_LEN)
    {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(json!({ "error": "stack exceeds maximum length" })),
        ));
    }
    if payload.url.len() > MAX_ERROR_URL_LEN {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(json!({ "error": "url exceeds maximum length" })),
        ));
    }

    let client_ip = real_client_ip(&headers, addr);
    let client_hash = hash_ip(&client_ip);
    warn!(
        client_hash = %client_hash,
        error_message = %payload.message,
        error_url = %payload.url,
        error_stack = ?payload.stack,
        "client_error"
    );
    Ok(StatusCode::NO_CONTENT)
}

#[utoipa::path(
    get,
    path = "/health",
    responses(
        (status = 200, description = "Server is healthy", body = inline(Object))
    ),
    tag = "system"
)]
pub async fn health_check() -> Result<Json<Value>, StatusCode> {
    Ok(Json(json!({
        "status": "healthy",
        "timestamp": std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs(),
    })))
}
