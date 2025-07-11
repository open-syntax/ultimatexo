use axum::{
    Json,
    extract::{Path, Query, State},
    http::StatusCode,
};
use serde_json::{Value, json};
use std::sync::Arc;

use crate::{
    app::state::AppState,
    models::{RoomInfo, RoomNameQuery},
};

pub async fn get_rooms(
    State(state): State<Arc<AppState>>,
    Query(RoomNameQuery { name }): Query<RoomNameQuery>,
) -> Result<Json<Vec<RoomInfo>>, StatusCode> {
    let rooms = state.get_public_rooms(name.as_deref()).await;
    Ok(Json(rooms))
}

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

pub async fn create_room(
    State(state): State<Arc<AppState>>,
    Json(room_info): Json<RoomInfo>,
) -> Result<Json<Value>, StatusCode> {
    match state.create_room(room_info).await {
        Ok(room_id) => Ok(Json(json!({ "room_id": room_id }))),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

pub async fn health_check() -> Result<Json<Value>, StatusCode> {
    Ok(Json(json!({
        "status": "healthy",
        "timestamp": std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs(),
    })))
}
