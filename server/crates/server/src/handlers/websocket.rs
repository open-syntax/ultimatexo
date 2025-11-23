use crate::{
    app::AppState,
    handlers::{ConnectionContext, spawn_receive_task, spawn_send_task},
};
use axum::{
    extract::{
        ConnectInfo, Path, Query, State, WebSocketUpgrade,
        ws::{Message, WebSocket},
    },
    response::Response,
};
use futures_util::{
    SinkExt, StreamExt,
    stream::{SplitSink, SplitStream},
};
use std::{net::SocketAddr, sync::Arc};
use tokio::{select, sync::Mutex};
use tracing::{debug, error, info, warn};
use ultimatexo_core::{
    AppError, PlayerAction, Room, RoomType, SerizlizedPlayer, ServerMessage, Status, WebSocketQuery,
};
use ultimatexo_services::GameAIService;

pub type Sender = Arc<Mutex<SplitSink<WebSocket, Message>>>;
type Receiver = SplitStream<WebSocket>;

#[utoipa::path(
    get,
    path = "/{room_id}",
    params(
        ("room_id" = String, Path),
        WebSocketQuery
    ),
)]
pub async fn websocket_handler(
    ws: WebSocketUpgrade,
    Path(room_id): Path<String>,
    State(state): State<Arc<AppState>>,
    Query(payload): Query<WebSocketQuery>,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
) -> Response {
    ws.on_upgrade(move |socket| handle_socket_upgrade(socket, state, room_id, payload, addr))
}

async fn handle_socket_upgrade(
    socket: WebSocket,
    state: Arc<AppState>,
    room_id: String,
    payload: WebSocketQuery,
    addr: SocketAddr,
) {
    let (sender, receiver) = socket.split();
    let sender = Arc::new(Mutex::new(sender));

    if let Err(error) = handle_socket(
        sender.clone(),
        receiver,
        state,
        room_id.clone(),
        payload,
        addr,
    )
    .await
        && let Err(e) = send_error_and_close(sender, error, addr).await
    {
        warn!("Failed to send error message to {}: {}", room_id, e);
    }
}
async fn handle_socket(
    sender: Sender,
    receiver: Receiver,
    state: Arc<AppState>,
    room_id: String,
    payload: WebSocketQuery,
    addr: SocketAddr,
) -> Result<(), AppError> {
    info!("User {} is connecting room {}", addr, room_id);
    let room_service = state.get_room_service(&room_id).await?;
    let is_reconnecting = payload.is_reconnecting;
    let (room, player_id) = room_service.join_room(&room_id, payload, addr).await?;

    let (player_tx, player_rx) = tokio::sync::mpsc::unbounded_channel();

    let connection_ctx = Arc::new(ConnectionContext::new(player_id.clone(), player_tx));

    handle_game_start(room.clone(), connection_ctx.clone(), is_reconnecting).await?;

    let mut send_task = spawn_send_task(sender, player_rx, connection_ctx.clone());
    let mut receive_task = spawn_receive_task(receiver, room.clone(), connection_ctx.clone());

    let result = {
        #[cfg(debug_assertions)]
        {
            select! {
                r = &mut send_task => {
                    receive_task.abort();
                    ("send", r)
                },
                r = &mut receive_task => {
                    send_task.abort();
                    ("receive", r)
                },
            }
        }
        #[cfg(not(debug_assertions))]
        {
            use crate::handlers::spawn_heartbeat_task;

            let mut heartbeat_task = spawn_heartbeat_task(connection_ctx.clone());
            select! {
                r = &mut heartbeat_task => {
                    send_task.abort();
                    receive_task.abort();
                    ("heartbeat", r)
                },
                r = &mut send_task => {
                    heartbeat_task.abort();
                    receive_task.abort();
                    ("send", r)
                },
                r = &mut receive_task => {
                    heartbeat_task.abort();
                    send_task.abort();
                    ("receive", r)
                },
            }
        }
    };

    match result {
        (name, Ok(_)) => debug!("Room {}: {} task completed", room.info.id, name),
        (name, Err(e)) => error!("Room {}: {} task failed: {}", room.info.id, name, e),
    }
    if let Err(e) = room_service
        .handle_player_leaving(room_id.as_str(), player_id.as_str())
        .await
    {
        error!("Error during player disconnect cleanup: {}", e);
    }
    info!("Player {} disconnected from room {}", player_id, room_id);
    Ok(())
}

async fn handle_game_start(
    room: Arc<Room>,
    ctx: Arc<ConnectionContext>,
    is_reconnecting: bool,
) -> Result<(), AppError> {
    let player_id = &ctx.player_id.clone();
    handle_player_connection_message(room.clone(), ctx, is_reconnecting).await?;

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
            let player_marker = room.get_player(player_id).await?.info.marker;
            let current_player = room.game.lock().await.get_current_player().marker;
            room.game.lock().await.set_board_status(Status::InProgress);
            if current_player != player_marker {
                let mut game = room.game.lock().await;
                if is_reconnecting {
                    GameAIService::make_ai_move(&mut game, current_player).await?;
                } else {
                    GameAIService::make_random_ai_move(&mut game).await?;
                }
            }
            room.send_board().await;
        }
        RoomType::LocalRoom => {
            room.game.lock().await.set_board_status(Status::InProgress);
            room.send_board().await;
        }
    }

    Ok(())
}
async fn handle_player_connection_message(
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

    let player = room.get_player(&ctx.player_id).await.unwrap();
    player
        .tx
        .unwrap()
        .send(ServerMessage::PlayerUpdate {
            action: action.clone(),
            player: SerizlizedPlayer::new(player.info.marker, Some(player.id)),
        })
        .unwrap();
    if let Ok(opponent) = room.get_opponent(&ctx.player_id).await
        && room.info.room_type == RoomType::Standard
    {
        opponent
            .tx
            .unwrap()
            .send(ServerMessage::PlayerUpdate {
                action,
                player: SerizlizedPlayer::new(player.info.marker, None),
            })
            .unwrap();
    }
    Ok(())
}

async fn send_error_and_close(
    sender: Sender,
    error: AppError,
    addr: SocketAddr,
) -> Result<(), AppError> {
    info!(
        "Sending error and closing connection for {}: {}",
        addr, error
    );
    let mut sender = sender.lock().await;
    let error_msg = Message::Text(format!("Error: {}", error).into());
    if let Err(e) = sender.send(error_msg).await {
        warn!("Failed to send error message to {}: {}", addr, e);
    }
    if let Err(e) = sender.send(Message::Close(None)).await {
        warn!("Failed to close WebSocket for {}: {}", addr, e);
    }
    Ok(())
}
