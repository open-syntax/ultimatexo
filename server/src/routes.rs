use crate::{
    app::{Room, RoomData, RoomManager},
    game::{Board, Game, Player},
    utils::send_board,
};
use anyhow::Result;
use axum::{
    Json,
    extract::{
        Path, State, WebSocketUpgrade,
        ws::{Message, WebSocket},
    },
    response::Response,
};
use futures_util::{
    SinkExt,
    stream::{SplitSink, SplitStream, StreamExt},
};

use rand::Rng;
use serde::{Deserialize, Serialize};
use serde_json::{Value, from_str};
use std::sync::Arc;
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
        next_board: Option<String>,
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
        Ok(serde_json::to_string(self)?)
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
            return;
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
    let _ = room.tx.send(serde_json::to_string(&msg).unwrap());
    if room.data.bot_level.is_some() {
        room.game.lock().await.add_player();
    }
    if room.tx.receiver_count() == 2
        || (room.data.bot_level.is_some() && room.tx.receiver_count() == 1)
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
                                    if room.data.bot_level.is_some() {
                                        let level =
                                            match room.data.bot_level.as_ref().unwrap().as_str() {
                                                "Easy" => 2,
                                                "Average" => 2,
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

pub async fn get_rooms_handler(State(state): State<Arc<RoomManager>>) -> String {
    state
        .rooms
        .iter()
        .filter(|room| room.data.is_public)
        .count()
        .to_string()
}

pub async fn new_room_handler(
    State(state): State<Arc<RoomManager>>,
    Json(payload): Json<RoomData>,
) -> String {
    let (tx, _) = broadcast::channel(100);
    let room = Arc::new(Room {
        tx,
        game: Arc::new(Mutex::new(Game::new())),
        data: RoomData {
            is_public: payload.is_public,
            password: payload.password,
            bot_level: payload.bot_level,
        },
    });

    let room_id = rand::rng().random_range(11111..=99999).to_string();
    state.rooms.insert(room_id.clone(), room);
    room_id
}
