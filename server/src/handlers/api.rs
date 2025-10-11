use crate::{
    app::AppState,
    models::{GetRoomQuery, RoomInfo},
};
use axum::{
    Json,
    extract::{Path, Query, State},
    http::StatusCode,
};
use serde_json::{Value, json};
use std::sync::Arc;

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
) -> Result<Json<Vec<RoomInfo>>, StatusCode> {
    let rooms = state.get_public_rooms(name.as_deref()).await;
    Ok(Json(rooms))
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
        (status = 500, description = "Internal server error")
    ),
    tag = "rooms"
)]
pub async fn create_room(
    State(state): State<Arc<AppState>>,
    Json(room_info): Json<RoomInfo>,
) -> Result<Json<Value>, StatusCode> {
    match state.create_room(room_info).await {
        Ok(room_id) => Ok(Json(json!({ "room_id": room_id }))),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

#[utoipa::path(
    get,
    path = "/mem",
    responses(
        (status = 200, description = "Memory information retrieved", body = inline(Object))
    ),
    tag = "system"
)]
pub async fn check_server_memory(
    State(state): State<Arc<AppState>>,
) -> Result<Json<Value>, StatusCode> {
    let mem = state.check_server_memory().await;
    Ok(Json(json!({ "mem": mem })))
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
