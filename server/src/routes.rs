use futures_util::SinkExt;
use futures_util::stream::StreamExt;
use std::sync::Arc;
use tokio::sync::broadcast;

use axum::{
    extract::{
        Path, State, WebSocketUpgrade,
        ws::{Message, WebSocket},
    },
    response::Response,
};

use crate::{AppState, game::Game};

pub async fn websocket_handler(
    ws: WebSocketUpgrade,
    Path(room_id): Path<String>,
    State(state): State<Arc<AppState>>,
) -> Response {
    ws.on_upgrade(move |socket| handle_socket(socket, state, room_id))
}

async fn handle_socket(socket: WebSocket, state: Arc<AppState>, room_id: String) {
    let (mut sender, mut receiver) = socket.split();

    let mut rooms = state.rooms.lock().unwrap();
    let (tx, mut game) = rooms
        .entry(room_id.clone())
        .or_insert_with(|| {
            let (tx, _) = broadcast::channel(100);
            let game = Game::new();
            (tx, game)
        })
        .clone();
    drop(rooms);

    let mut rx = tx.subscribe();
    let user_id = uuid::Uuid::new_v4().to_string();

    tokio::spawn({
        let user_id = user_id.clone();
        async move {
            while let Ok((msg, sender_id)) = rx.recv().await {
                if user_id.ne(&sender_id) {
                    if sender.send(Message::Text(msg.into())).await.is_err() {
                        break;
                    }
                }
            }
        }
    });

    tokio::spawn({
        let user_id = user_id.clone();
        async move {
            while let Some(Ok(Message::Text(text))) = receiver.next().await {
                if text.contains("text ") {
                    let msg = format!("{}", text);
                    let _ = tx.send((msg, user_id.clone()));
                } else {
                    if game.update_game(text.as_str()).unwrap() {
                        let _ = tx.send(("Game Won".to_string(), user_id.clone()));
                    }
                }
            }
        }
    });
}
