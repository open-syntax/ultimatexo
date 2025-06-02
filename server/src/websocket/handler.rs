use futures_util::{SinkExt, StreamExt};
use std::sync::{Arc, atomic::Ordering};

use anyhow::Result;
use axum::{
    extract::{
        Path, Query, State, WebSocketUpgrade,
        ws::{Message, WebSocket},
    },
    response::Response,
};
use futures_util::stream::{SplitSink, SplitStream};
use tokio::sync::Mutex;

use crate::{
    error::AppError,
    room::manager::RoomManager,
    types::{ServerMessage, Status, WebSocketQuery},
    utils::{handle_event, parse_message, send_board},
};

pub async fn websocket_handler(
    ws: WebSocketUpgrade,
    Path(path): Path<String>,
    State(state): State<Arc<RoomManager>>,
    Query(payload): Query<WebSocketQuery>,
) -> Response {
    ws.on_upgrade(async move |socket| {
        let (sender, receiver) = socket.split();
        let sender = Arc::new(Mutex::new(sender));
        if let Err(err) = handle_socket(sender.clone(), receiver, state, path, payload).await {
            let err = ServerMessage::Error(err);
            let json_msg = match err.to_json() {
                Ok(json) => json,
                Err(err) => err.to_string(),
            };
            sender
                .lock()
                .await
                .send(Message::Text(json_msg.into()))
                .await
                .unwrap();
        }
    })
}

async fn handle_socket(
    sender: Arc<Mutex<SplitSink<WebSocket, Message>>>,
    mut receiver: SplitStream<WebSocket>,
    state: Arc<RoomManager>,
    room_id: String,
    payload: WebSocketQuery,
) -> Result<(), AppError> {
    let (room, player, mut rx) = state
        .join(&room_id, payload.password, payload.player_id)
        .await?;

    let send_ws = tokio::spawn({
        let player = player.clone();
        async move {
            let current_id = player.id.unwrap();
            while let Ok(msg) = rx.recv().await {
                let json_msg = match &msg {
                    ServerMessage::PlayerUpdate { action, player } => {
                        // Clone player so you can modify it without moving
                        let mut player_clone = player.clone();

                        // Your condition to modify player_clone.id
                        if let Some(id) = &player_clone.id {
                            if id != &current_id {
                                player_clone.id = None;
                            }
                        }

                        // Create new message with modified player_clone
                        let updated_msg = ServerMessage::PlayerUpdate {
                            action: action.clone(),
                            player: player_clone,
                        };

                        match updated_msg.to_json() {
                            Ok(json) => json,
                            Err(_) => continue,
                        }
                    }
                    _ => match msg.to_json() {
                        Ok(json) => json,
                        Err(_) => continue,
                    },
                };

                if sender
                    .lock()
                    .await
                    .send(Message::Text(json_msg.into()))
                    .await
                    .is_err()
                {
                    break;
                }
            }
        }
    });

    let recv_ws = tokio::spawn({
        let room = room.clone();
        async move {
            while let Some(message_result) = receiver.next().await {
                match message_result {
                    Ok(message) => {
                        if let Ok(client_message) = parse_message(message) {
                            if let Err(err) = handle_event(client_message, room.clone()).await {
                                let _ = room.tx.send(ServerMessage::Error(err));
                            }
                        }
                    }
                    Err(err) => {
                        let _ = room.tx.send(ServerMessage::Error(err.into()));
                    }
                }
            }
        }
    });

    if room.player_counter.load(Ordering::Relaxed) == 2 {
        room.game.lock().await.state.board.status = Status::InProgress;
        send_board(&room.tx, room.game.clone()).await;
    }

    tokio::select! {
        _ = send_ws => {},
        _ = recv_ws => {},
    }

    let _ = state.leave(&room_id, player).await;
    Ok(())
}
