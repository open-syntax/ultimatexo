use anyhow::Result;
use futures_util::SinkExt;
use futures_util::stream::StreamExt;
use serde::{Deserialize, Serialize};
use serde_json::{Value, from_str};
use std::sync::Arc;
use tokio::sync::{Mutex, broadcast};
use uuid::Uuid;

use axum::{
    extract::{
        Path, State, WebSocketUpgrade,
        ws::{Message, WebSocket},
    },
    response::Response,
};

use crate::{
    AppState,
    game::{Board, Game, Marker, Player},
};

#[derive(Serialize, Deserialize)]
#[serde(tag = "event", content = "data")]
pub enum ServerMessage {
    TextMessage {},
    GameUpdate {
        board: Board,
        status: Option<String>,
        next_player: Player,
        next_board: usize,
    },
    PlayerUpdate {
        message: String,
        marker: Marker,
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
    Path(room_id): Path<String>,
    State(state): State<Arc<AppState>>,
) -> Response {
    ws.on_upgrade(move |socket| handle_socket(socket, state, room_id))
}

async fn handle_socket(socket: WebSocket, state: Arc<AppState>, room_id: String) {
    let (mut sender, mut receiver) = socket.split();

    let (tx, game) = {
        let mut rooms = state.rooms.lock().await;
        let entry = rooms.entry(room_id.clone()).or_insert_with(|| {
            let (tx, _) = broadcast::channel(100);
            let game = Game::new();
            (tx, Arc::new(Mutex::new(game))) // Wrap game in Arc<Mutex>
        });
        (entry.0.clone(), Arc::clone(&entry.1))
    };

    if tx.receiver_count() >= 2 {
        let _ = sender.send(Message::Text("ROOM_FULL".into())).await;
        return;
    }
    let mut rx = tx.subscribe();

    let marker = if tx.receiver_count() == 1 {
        Marker::X
    } else {
        Marker::O
    };
    let player = game
        .lock()
        .await
        .add_player(Uuid::new_v4().to_string(), marker);
    let _ = tx.send(
        ServerMessage::PlayerUpdate {
            message: "New Player Joined".to_string(),
            marker: player.marker,
        }
        .to_json()
        .unwrap(),
    );

    let send_task = tokio::spawn({
        async move {
            while let Ok(msg) = rx.recv().await {
                if sender.send(Message::Text(msg.into())).await.is_err() {
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
                                let _ = tx.send(ServerMessage::TextMessage {}.to_json().unwrap());
                            }
                        }
                        Some("GameUpdate") => {
                            if let Some(content) = json.get("move").and_then(|c| c.as_str()) {
                                let mut game = game.lock().await;
                                match game.update_game(content) {
                                    Ok(result) => {
                                        let _ = tx.send(
                                            ServerMessage::GameUpdate {
                                                board: game.board(),
                                                status: game.status(),
                                                next_player: game.next_player(),
                                                next_board: result,
                                            }
                                            .to_json()
                                            .unwrap(),
                                        );
                                    }
                                    Err(err) => {
                                        let _ = tx.send(
                                            ServerMessage::GameError {
                                                error: err.to_string(),
                                            }
                                            .to_json()
                                            .unwrap(),
                                        );
                                    }
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

    let mut rooms = state.rooms.lock().await;
    if let Some((tx, _)) = rooms.get(&room_id) {
        let _ = tx.send(
            ServerMessage::PlayerUpdate {
                message: "Player Left".to_string(),
                marker: player.marker,
            }
            .to_json()
            .unwrap(),
        );
        if tx.receiver_count() == 0 {
            rooms.remove(&room_id);
        }
    }
}

pub async fn get_rooms_handler(State(state): State<Arc<AppState>>) -> String {
    state.rooms.lock().await.len().to_string()
}
