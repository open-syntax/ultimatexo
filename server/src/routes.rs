use crate::{
    game::{Board, Game, Player},
    room::{Room, RoomInfo, RoomManager},
    utils::send_board,
};
use anyhow::Result;
use axum::{
    Json,
    extract::{
        Path, Query, State, WebSocketUpgrade,
        ws::{Message, WebSocket},
    },
    http::StatusCode,
    response::Response,
};
use futures_util::{
    SinkExt,
    stream::{SplitSink, SplitStream, StreamExt},
};

use rand::Rng;
use serde::{Deserialize, Serialize};
use serde_json::{Value, from_str, json, to_string};
use std::{sync::Arc, time::SystemTime};
use tokio::sync::{Mutex, broadcast};

#[derive(Serialize, Deserialize)]
#[serde(tag = "event", content = "data")]
pub enum ServerMessage {
    TextMessage {
        message: String,
        player: Player,
    },
    GameUpdate {
        board: Board,
        next_player: Player,
        next_board: Option<usize>,
    },
    PlayerUpdate {
        action: String,
        player: Player,
    },
    GameError {
        error: String,
    },
    Error {
        error: String,
    },
}

impl ServerMessage {
    pub fn to_json(&self) -> Result<String> {
        Ok(to_string(self)?)
    }
}

pub async fn websocket_handler(
    ws: WebSocketUpgrade,
    Path(path): Path<String>,
    State(state): State<Arc<RoomManager>>,
) -> Response {
    ws.on_upgrade(async move |socket| {
        let (sender, receiver) = socket.split();
        let sender = Arc::new(Mutex::new(sender));
        if let Err(err) = handle_socket(sender.clone(), receiver, state, path).await {
            sender
                .lock()
                .await
                .send(Message::text(
                    ServerMessage::Error {
                        error: err.to_string(),
                    }
                    .to_json()
                    .unwrap(),
                ))
                .await
                .unwrap();
        }
    })
}

async fn handle_socket(
    sender: Arc<Mutex<SplitSink<WebSocket, Message>>>,
    mut receiver: SplitStream<WebSocket>,
    state: Arc<RoomManager>,
    path: String,
) -> Result<()> {
    let (room_id, password) = {
        if path.contains(":") {
            let mut path_splitted = path.split(":");
            (
                path_splitted.next().unwrap().to_string(),
                Some(path_splitted.next().unwrap().to_string()),
            )
        } else {
            (path, None)
        }
    };
    let (player, room) = state.join(&room_id, password).await?;
    let tx = room.tx.clone();
    let mut rx = tx.subscribe();

    let msg = ServerMessage::PlayerUpdate {
        action: "PLAYER_JOINED".to_string(),
        player: player.clone(),
    };
    let _ = room.tx.send(to_string(&msg).unwrap());
    if room.info.bot_level.is_some() {
        room.game.lock().await.add_player();
    }
    if room.tx.receiver_count() == 2
        || (room.info.bot_level.is_some() && room.tx.receiver_count() == 1)
    {
        send_board(&tx, room.game.clone()).await;
    }

    let send_task = tokio::spawn({
        async move {
            while let Ok(msg) = rx.recv().await {
                if sender
                    .lock()
                    .await
                    .send(Message::Text(msg.into()))
                    .await
                    .is_err()
                {
                    break;
                }
            }
        }
    });

    let recv_task = tokio::spawn({
        let player = player.clone();
        async move {
            while let Some(Ok(Message::Text(json_input))) = receiver.next().await {
                match from_str::<Value>(&json_input) {
                    Ok(json) => match json.get("event").and_then(|t| t.as_str()) {
                        Some("TextMessage") => {
                            if let Some(content) = json.get("message").and_then(|c| c.as_str()) {
                                let _ = tx.send(
                                    ServerMessage::TextMessage {
                                        message: content.to_string(),
                                        player: player.clone(),
                                    }
                                    .to_json()
                                    .unwrap(),
                                );
                            }
                        }
                        Some("GameUpdate") => {
                            if let Some(position) = json.get("move").and_then(|c| c.as_str()) {
                                if let Err(err) = room.game.lock().await.update_game(
                                    position,
                                    json.get("player_id").unwrap().as_str().unwrap(),
                                ) {
                                    let _ = tx.send(
                                        ServerMessage::GameError {
                                            error: err.to_string(),
                                        }
                                        .to_json()
                                        .unwrap(),
                                    );
                                } else {
                                    if room.info.bot_level.is_some() {
                                        let level =
                                            match room.info.bot_level.as_ref().unwrap().as_str() {
                                                "Easy" => 2,
                                                "Normal" => 2,
                                                "Hard" => 2,
                                                _ => {
                                                    let _ = tx.send(
                                                        ServerMessage::Error {
                                                            error: "INVALID_BOT_LEVEL".to_string(),
                                                        }
                                                        .to_json()
                                                        .unwrap(),
                                                    );
                                                    return;
                                                }
                                            };
                                        room.game.lock().await.generate_move(level);
                                    }
                                    send_board(&tx, room.game.clone()).await;
                                }
                            }
                        }
                        Some(_) => {
                            let _ = tx.send(
                                ServerMessage::Error {
                                    error: "Unknown message type".to_string(),
                                }
                                .to_json()
                                .unwrap(),
                            );
                        }
                        None => {
                            let _ = tx.send(
                                ServerMessage::Error {
                                    error: "Message missing type field".to_string(),
                                }
                                .to_json()
                                .unwrap(),
                            );
                        }
                    },
                    Err(e) => {
                        eprintln!("Failed to parse JSON: {}", e);
                    }
                }
            }
        }
    });

    tokio::select! {
        _ = send_task => {},
        _ = recv_task => {},
    }

    let _ = state.leave(&room_id, player).await;
    Ok(())
}

#[derive(Deserialize)]
pub struct RoomNameQuery {
    name: Option<String>,
}

pub async fn get_rooms(
    State(state): State<Arc<RoomManager>>,
    Query(RoomNameQuery { name }): Query<RoomNameQuery>,
) -> Result<Json<Vec<RoomInfo>>, StatusCode> {
    let rooms;
    if name.is_some() {
        rooms = state
            .rooms
            .iter()
            .map(|room| room.info.clone())
            .filter(|room| name.as_ref().unwrap().starts_with(&room.name))
            .collect::<Vec<RoomInfo>>();
    } else {
        rooms = state
            .rooms
            .iter()
            .map(|room| room.info.clone())
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
    let room_id = rand::rng().random_range(11111..=99999).to_string();
    let (tx, _) = broadcast::channel(100);
    let is_protected = payload.password.is_some();
    let room = Arc::new(Room {
        tx,
        game: Arc::new(Mutex::new(Game::new())),
        info: RoomInfo {
            id: room_id.clone(),
            name: payload.name,
            is_public: payload.is_public,
            password: payload.password,
            bot_level: payload.bot_level,
            is_protected,
        },
    });

    state.rooms.insert(room_id.clone(), room);
    room_id
}

pub async fn check_room_password(
    State(state): State<Arc<RoomManager>>,
    Path(room_id): Path<String>,
    Json(password): Json<String>,
) -> Result<Json<Value>, StatusCode> {
    let room = state.rooms.get(&room_id).ok_or(StatusCode::NOT_FOUND)?;

    let is_valid = match &room.info.password {
        Some(pass) => pass == &password,
        None => password.is_empty(),
    };

    Ok(Json(json!({ "valid": is_valid })))
}

pub async fn health_check() -> Result<Json<Value>, StatusCode> {
    Ok(Json(json!({
        "status": "healthy",
        "timestamp": SystemTime::now()
    })))
}
