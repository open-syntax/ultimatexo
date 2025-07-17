use axum::extract::ws::Message;
use axum::extract::{Path, Query, State, WebSocketUpgrade, ws::WebSocket};
use axum::response::Response;
use futures_util::{SinkExt, StreamExt};
use std::sync::Arc;
use tokio::sync::mpsc::UnboundedSender;

use crate::app::state::AppState;
use crate::error::AppError;
use crate::handlers::{spawn_heartbeat_task, spawn_receive_task, spawn_send_task};
use crate::models::{PlayerAction, Room, ServerMessage, WebSocketQuery};

async fn send_error_and_close(
    mut sender: futures_util::stream::SplitSink<WebSocket, Message>,
    error: AppError,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let error_msg = ServerMessage::Error(error);
    let json_msg = error_msg.to_json()?;
    sender.send(Message::Text(json_msg.into())).await?;
    sender.close().await?;
    Ok(())
}

pub async fn websocket_handler(
    ws: WebSocketUpgrade,
    Path(room_id): Path<String>,
    State(state): State<Arc<AppState>>,
    Query(payload): Query<WebSocketQuery>,
) -> Response {
    ws.on_upgrade(async move |socket| handle_socket(socket, state, room_id, payload).await)
}

async fn handle_socket(
    socket: WebSocket,
    state: Arc<AppState>,
    room_id: String,
    payload: WebSocketQuery,
) {
    let (sender, receiver) = socket.split();

    let room_service = match state.get_room_service(&room_id).await {
        Some(service) => service,
        None => {
            let _ = send_error_and_close(sender, AppError::room_not_found()).await;
            return;
        }
    };

    let (room, player_id) = match room_service
        .join_room(&room_id, payload.password, payload.player_id.clone())
        .await
    {
        Ok(result) => result,
        Err(err) => {
            let _ = send_error_and_close(sender, err).await;
            return;
        }
    };

    let (player_tx, player_rx) = tokio::sync::mpsc::unbounded_channel();

    handle_player_connection(
        room.clone(),
        &player_id,
        player_tx.clone(),
        payload.player_id.is_some(),
    )
    .await
    .unwrap();

    handle_game_start(room.clone()).await;

    // let heartbeat_task = spawn_heartbeat_task(player_tx.clone(), player_id.clone());
    let send_task = spawn_send_task(sender, player_rx, player_id.clone());
    let receive_task = spawn_receive_task(receiver, room, player_id.clone());

    tokio::select! {
        // _ = heartbeat_task => {},
        _ = send_task => {},
        _ = receive_task => {},
    }

    let _ = room_service.leave_room(&room_id, &player_id).await;
    tracing::info!("Player {} disconnected from room {}", player_id, room_id);
}

async fn handle_game_start(room: Arc<Room>) {
    use crate::models::Status;
    use std::sync::atomic::Ordering;

    let player_count = room.player_counter.load(Ordering::SeqCst);
    let game_status = room.game.lock().await.get_board_status();

    if player_count == 2 && matches!(game_status, Status::WaitingForPlayers | Status::Paused) {
        room.game.lock().await.set_board_status(Status::InProgress);
        room.send_board().await;
    }
}
async fn handle_player_connection(
    room: Arc<Room>,
    player_id: &str,
    player_tx: UnboundedSender<ServerMessage>,
    is_reconnection: bool,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let mut players_guard = room.players.lock().await;

    let player = players_guard
        .iter_mut()
        .find(|p| p.id.as_ref() == Some(&player_id.to_string()))
        .ok_or("Player not found in room")?;

    player.tx = Some(player_tx);

    let action = if is_reconnection {
        PlayerAction::PlayerReconnected
    } else {
        PlayerAction::PlayerJoined
    };

    let player_update = ServerMessage::PlayerUpdate {
        action,
        player: player.clone(),
    };

    drop(players_guard);

    room.tx
        .send(player_update)
        .await
        .map_err(|e| format!("Failed to send player update: {}", e))?;

    Ok(())
}
