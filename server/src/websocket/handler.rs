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
    ws.on_upgrade(async move |socket| handle_socket(socket, state, path, payload).await)
}
async fn send_error_and_close(
    mut sender: futures_util::stream::SplitSink<WebSocket, axum::extract::ws::Message>,
    error: AppError,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    use axum::extract::ws::Message;

    let error_msg = ServerMessage::Error(error);
    let json_msg = error_msg.to_json()?;

    sender.send(Message::Text(json_msg.into())).await?;
    sender.close().await?;

    Ok(())
}

async fn handle_socket(
    socket: WebSocket,
    state: Arc<RoomManager>,
    room_id: String,
    payload: WebSocketQuery,
) {
    let (mut sender, mut receiver) = socket.split();
    let (room, player, mut server_rx) = match state
        .join(&room_id, payload.password, payload.player_id)
        .await
    {
        Ok(result) => result,
        Err(err) => {
            if let Err(e) = send_error_and_close(sender, err).await {
                tracing::error!("Failed to send error message: {}", e);
            }
            return;
        }
    };

    let send_ws = tokio::spawn({
        async move {
            while let Ok(msg) = server_rx.recv().await {
                let json_msg = match msg.to_json() {
                    Ok(json) => json,
                    Err(_) => continue,
                };

                if sender.send(Message::Text(json_msg.into())).await.is_err() {
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
}
