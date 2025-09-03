use crate::{
    app::AppState,
    error::AppError,
    handlers::{ConnectionContext, spawn_heartbeat_task, spawn_receive_task, spawn_send_task},
    models::{Marker, PlayerAction, Room, RoomType, ServerMessage, Status, WebSocketQuery},
};
use axum::{
    extract::{
        ConnectInfo, Path, Query, State, WebSocketUpgrade,
        ws::{Message, WebSocket},
    },
    http::HeaderMap,
    response::Response,
};

use futures_util::{
    SinkExt, StreamExt,
    stream::{SplitSink, SplitStream},
};
use std::{
    net::{IpAddr, SocketAddr},
    sync::Arc,
};
use tokio::{sync::Mutex, try_join};
use tracing::{error, info, warn};

pub type Sender = Arc<Mutex<SplitSink<WebSocket, Message>>>;
type Receiver = SplitStream<WebSocket>;

pub async fn websocket_handler(
    ws: WebSocketUpgrade,
    Path(room_id): Path<String>,
    State(state): State<Arc<AppState>>,
    Query(payload): Query<WebSocketQuery>,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    headers: HeaderMap,
) -> Response {
    ws.on_upgrade(move |socket| {
        handle_socket_upgrade(
            socket,
            state,
            room_id,
            payload,
            get_real_ip(&headers, addr.ip()),
        )
    })
}

async fn handle_socket_upgrade(
    socket: WebSocket,
    state: Arc<AppState>,
    room_id: String,
    payload: WebSocketQuery,
    player_ip: IpAddr,
) {
    let (sender, receiver) = socket.split();
    let sender = Arc::new(Mutex::new(sender));

    if let Err(error) =
        handle_socket(sender.clone(), receiver, state, room_id, payload, player_ip).await
    {
        let _ = send_error_and_close(sender, error).await;
    }
}
async fn handle_socket(
    sender: Sender,
    receiver: Receiver,
    state: Arc<AppState>,
    room_id: String,
    payload: WebSocketQuery,
    player_ip: IpAddr,
) -> Result<(), AppError> {
    let room_service = state.get_room_service(&room_id).await.unwrap();
    let is_reconnecting = payload.is_reconnecting;
    let (room, player_id) = room_service.join_room(&room_id, payload, player_ip).await?;

    let (player_tx, player_rx) = tokio::sync::mpsc::unbounded_channel();

    let connection_ctx = Arc::new(ConnectionContext::new(player_id.clone(), player_tx));
    handle_player_connection(room.clone(), connection_ctx.clone(), is_reconnecting).await?;

    handle_game_start(room.clone()).await;

    let heartbeat_task = spawn_heartbeat_task(connection_ctx.clone());
    let send_task = spawn_send_task(sender, player_rx, connection_ctx.clone());
    let receive_task = spawn_receive_task(receiver, room.clone(), connection_ctx.clone());

    match try_join!(heartbeat_task, send_task, receive_task) {
        Ok(_) => {
            info!("All tasks completed successfully");
        }
        Err(e) => {
            error!("One or more tasks failed: {}", e);
        }
    }

    if let Err(e) = room_service
        .handle_player_leaving(room_id.as_str(), player_id.as_str())
        .await
    {
        warn!("Error during player disconnect cleanup: {}", e);
    }
    tracing::info!("Player {} disconnected from room {}", player_id, room_id);
    Ok(())
}

async fn handle_game_start(room: Arc<Room>) {
    let player_count = room.get_player_count();
    let game_status = room.game.lock().await.get_board_status();
    match room.info.room_type {
        RoomType::Standard => {
            if player_count == 2
                && matches!(game_status, Status::WaitingForPlayers | Status::Paused)
            {
                room.game.lock().await.set_board_status(Status::InProgress);
                room.send_board().await;
            }
        }
        RoomType::BotRoom => {
            let current_player = room.game.lock().await.get_current_player().marker;
            room.game.lock().await.set_board_status(Status::InProgress);
            if current_player == Marker::O {
                room.game.lock().await.apply_ai_move(!current_player).await;
            }
            room.send_board().await;
        }
        RoomType::LocalRoom => {
            room.game.lock().await.set_board_status(Status::InProgress);
            room.send_board().await;
        }
    }
}
async fn handle_player_connection(
    room: Arc<Room>,
    ctx: Arc<ConnectionContext>,
    is_reconnection: bool,
) -> Result<(), AppError> {
    room.get_player_mut(&ctx.player_id, |player| {
        player.tx = Some(ctx.player_tx.clone())
    })
    .await;

    let action = if is_reconnection {
        PlayerAction::Reconnected
    } else {
        PlayerAction::Joined
    };

    let player_update = ServerMessage::PlayerUpdate { action };

    room.tx
        .send(player_update)
        .await
        .map_err(|e| AppError::internal_error(format!("Failed to send player update: {}", e)))?;

    Ok(())
}

async fn send_error_and_close(
    sender: Sender,
    error: AppError,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let error_msg = ServerMessage::Error(error);
    let json_msg = error_msg.to_json()?;
    sender
        .lock()
        .await
        .send(Message::Text(json_msg.into()))
        .await?;
    sender.lock().await.close().await?;
    Ok(())
}

fn get_real_ip(headers: &HeaderMap, fallback_ip: IpAddr) -> IpAddr {
    if let Some(real_ip) = headers.get("x-real-ip")
        && let Ok(ip_str) = real_ip.to_str()
        && let Ok(ip) = ip_str.parse::<IpAddr>()
    {
        return ip;
    }

    if let Some(forwarded_for) = headers.get("x-forwarded-for")
        && let Ok(forwarded_str) = forwarded_for.to_str()
        && let Some(first_ip) = forwarded_str.split(',').next()
        && let Ok(ip) = first_ip.trim().parse::<IpAddr>()
    {
        return ip;
    }

    fallback_ip
}
