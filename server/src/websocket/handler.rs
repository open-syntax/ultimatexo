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
    types::{PlayerAction, ServerMessage, Status, WebSocketQuery},
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
    let error_msg = ServerMessage::Error(error.clone());
    let json_msg = error_msg.to_json()?;

    sender.send(Message::Text(json_msg.into())).await?;
    dbg!(&error);
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
        .join(&room_id, payload.password, payload.player_id.clone())
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
    {
        let mut players_guard = room.players.lock().await;
        let player = players_guard
            .iter_mut()
            .find(|p| p.id.as_ref() == Some(&player_id))
            .unwrap();

        let join_action = match payload.player_id.is_some() {
            true => PlayerAction::PlayerReconnected,
            false => PlayerAction::PlayerJoined,
        };
        player.tx = Some(player_tx);

        let join_msg = ServerMessage::PlayerUpdate {
            action: join_action,
            player: player.clone(),
        };

        let _ = room.tx.send(join_msg).await;
    }

    let should_start_game = {
        let player_count = room.player_counter.load(Ordering::SeqCst);
        let game_status = room.game.lock().await.state.board.status;

        player_count == 2 && matches!(game_status, Status::WaitingForPlayers | Status::Paused)
    };

    if should_start_game {
        room.game.lock().await.state.board.status = Status::InProgress;
        room.send_board().await;
        tracing::info!("Game started in room {}", room_id);
    }

    // Task to send messages to this player
    let player_send_task = tokio::spawn({
        let player_id = player_id.clone();
        async move {
            while let Some(msg) = player_rx.recv().await {
                let filtered_msg = match &msg {
                    ServerMessage::PlayerUpdate { action, player } => {
                        let mut player_clone = player.clone();

                        if let Some(id) = &player_clone.id {
                            if id != &player_id {
                                player_clone.id = None;
                            }
                        }
                        ServerMessage::PlayerUpdate {
                            action: action.clone(),
                            player: player_clone,
                        }
                    }
                    _ => msg,
                };

                let json_msg = match filtered_msg.to_json() {
                    Ok(json) => json,
                    Err(e) => {
                        dbg!(&e);
                        tracing::error!("Failed to serialize message: {}", e);
                        continue;
                    }
                };
                if let Err(e) = sender.send(Message::Text(json_msg.into())).await {
                    dbg!(&e);
                    tracing::debug!("WebSocket sender closed for player {}", player_id);
                    break;
                }
            }
        }
    });

    let message_receive_task = tokio::spawn({
        let room = room.clone();
        let player_id = player_id.clone();
        async move {
            while let Some(message_result) = receiver.next().await {
                match message_result {
                    Ok(message) => match parse_message(message) {
                        Ok(client_message) => {
                            if let Err(err) = handle_event(client_message, room.clone()).await {
                                let error_msg = ServerMessage::Error(err);
                                let _ = room
                                    .get_player(&player_id)
                                    .await
                                    .unwrap()
                                    .tx
                                    .unwrap()
                                    .send(error_msg);
                            }
                        }
                        Err(e) => {
                            dbg!(&e);
                            tracing::warn!(
                                "Failed to parse message from player {}: {}",
                                player_id,
                                e
                            );
                        }
                    },
                    Err(err) => {
                        dbg!(&err);
                        tracing::warn!("WebSocket error for player {}: {}", player_id, err);
                        let error_msg = ServerMessage::Error(err.into());
                        let _ = room
                            .get_player(&player_id)
                            .await
                            .unwrap()
                            .tx
                            .unwrap()
                            .send(error_msg);
                        break;
                    }
                }
            }
            dbg!("err");
            tracing::debug!("Message receive task ended for player {}", player_id);
        }
    });

    tokio::select! {
        _ = message_receive_task => {
            tracing::debug!("Player {} WebSocket receive task ended", player_id);
        },
        _ = player_send_task => {
            tracing::debug!("Player {} WebSocket send task ended", player_id);
        },
    };

    if let Err(e) = state.leave(&room_id, player_id.clone()).await {
        tracing::error!("Error during player {} leave: {}", player_id, e);
    }

    tracing::info!("Player {} disconnected from room {}", player_id, room_id);
}
