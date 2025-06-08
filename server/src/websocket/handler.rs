use futures_util::{SinkExt, StreamExt};
use std::sync::{Arc, atomic::Ordering};
use tokio::sync::mpsc::unbounded_channel;

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
    utils::{handle_event, parse_message},
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
    let (room, player_id) = match state
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
    let (player_tx, mut player_rx) = unbounded_channel::<ServerMessage>();
    if let Some(player) = room
        .players
        .lock()
        .await
        .iter_mut()
        .find(|p| p.id == Some(player_id.clone()))
    {
        let tx = player.tx.get_or_init(|| async { player_tx }).await;

        let msg = ServerMessage::PlayerJoined {
            player: player.clone(),
        };
        let _ = tx.send(msg);
    }
    let player_send = tokio::spawn({
        async move {
            while let Some(msg) = player_rx.recv().await {
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
                                let _ = room.send(ServerMessage::Error(err));
                            }
                        }
                    }
                    Err(err) => {
                        let _ = room.send(ServerMessage::Error(err.into()));
                    }
                }
            }
        }
    });

    if room.player_counter.load(Ordering::Relaxed) == 2 {
        room.game.lock().await.state.board.status = Status::InProgress;
        room.send_board().await;
    }

    tokio::select! {
        _ = recv_ws => {},
        _ = player_send => {},
    }

    let _ = state.leave(&room_id, player_id).await;
}
