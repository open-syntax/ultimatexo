use rand::Rng;
use std::{sync::Arc, time::SystemTime};

use axum::{
    Json,
    extract::{Path, Query, State},
    http::StatusCode,
};
use serde_json::{Value, json};
use tokio::sync::broadcast;

use crate::{
    room::{manager::RoomManager, room::Room},
    types::{RoomInfo, RoomNameQuery, RoomPasswordCheck},
};

pub async fn get_rooms(
    State(state): State<Arc<RoomManager>>,
    Query(RoomNameQuery { name }): Query<RoomNameQuery>,
) -> Result<Json<Vec<RoomInfo>>, StatusCode> {
    let mut rooms = state
        .rooms
        .iter()
        .map(|room| room.info.clone())
        .filter(|room| room.is_public == true && room.bot_level.is_none())
        .collect::<Vec<RoomInfo>>();
    if name.is_some() {
        rooms = rooms
            .iter()
            .filter(|room| room.name.starts_with(name.as_ref().unwrap()))
            .cloned()
            .collect::<Vec<RoomInfo>>();
    }
    Ok(Json(rooms))
}

pub async fn get_room(
    State(state): State<Arc<RoomManager>>,
    Path(room_id): Path<String>,
) -> Result<Json<RoomInfo>, StatusCode> {
    state
        .rooms
        .get(&room_id)
        .map(|room| Json(room.info.clone()))
        .ok_or(StatusCode::NOT_FOUND)
}

pub async fn new_room(
    State(state): State<Arc<RoomManager>>,
    Json(payload): Json<RoomInfo>,
) -> String {
    let RoomInfo {
        name,
        is_public,
        bot_level,
        password,
        ..
    } = payload;

    let is_protected = password.is_some();
    let room_id = rand::rng().random_range(11111..=99999).to_string();
    let info = RoomInfo {
        id: room_id.clone(),
        name,
        is_public,
        bot_level,
        password,
        is_protected,
    };
    let (tx, _) = broadcast::channel(32);

    let room = Arc::new(Room::new(info, tx));

    state.rooms.insert(room_id.clone(), room);

    room_id
}

pub async fn check_room_password(
    State(state): State<Arc<RoomManager>>,
    Path(room_id): Path<String>,
    Json(payload): Json<RoomPasswordCheck>,
) -> Result<Json<Value>, StatusCode> {
    let room = state.rooms.get(&room_id).ok_or(StatusCode::NOT_FOUND)?;

    let is_valid = match &room.info.password {
        Some(password) => password == &payload.password,
        None => payload.password.is_empty(),
    };

    Ok(Json(json!({ "valid": is_valid })))
}

pub async fn health_check() -> Result<Json<Value>, StatusCode> {
    Ok(Json(json!({
        "status": "healthy",
        "timestamp": SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs(),
    })))
}
