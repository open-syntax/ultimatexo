use crate::{
    app::AppState,
    handlers::{ConnectionContext, spawn_receive_task, spawn_send_task},
};
use axum::{
    extract::{
        Path, Query, State, WebSocketUpgrade,
        ws::{Message, WebSocket},
    },
    response::Response,
};
use ultimatexo_core::{
    AppError, Marker, PlayerAction, Room, RoomType, SerizlizedPlayer, ServerMessage, Status,
    WebSocketQuery,
};

#[cfg(not(debug_assertions))]
use crate::handlers::spawn_heartbeat_task;
use futures_util::{
    SinkExt, StreamExt,
    stream::{SplitSink, SplitStream},
};
use std::sync::Arc;
use tokio::{sync::Mutex, try_join};
use tracing::{error, info, warn};

pub type Sender = Arc<Mutex<SplitSink<WebSocket, Message>>>;
type Receiver = SplitStream<WebSocket>;

#[utoipa::path(
    get,
    path = "/{room_id}",
    params(
        ("room_id" = String, Path, description = "The unique identifier of the room to join"),
        WebSocketQuery
    ),
    description = r#"
### Message Format

All messages are JSON-encoded with a type/event discriminator:

**Client Messages:**
```json
{
    "TextMessage|GameUpdate|RematchRequest|DrawRequest|Resign|Pong|Close": {
        //
    }
}
```

**Server Messages:**
```json
{
  "event": "TextMessage|GameUpdate|PlayerUpdate|RematchRequest|DrawRequest|Ping|Error",
  "data": { ... }
}
```
    "#,
    tag = "websocket"
)]
pub async fn websocket_handler(
    ws: WebSocketUpgrade,
    Path(room_id): Path<String>,
    State(state): State<Arc<AppState>>,
    Query(payload): Query<WebSocketQuery>,
) -> Response {
    ws.on_upgrade(move |socket| handle_socket_upgrade(socket, state, room_id, payload))
}

async fn handle_socket_upgrade(
    socket: WebSocket,
    state: Arc<AppState>,
    room_id: String,
    payload: WebSocketQuery,
) {
    let (sender, receiver) = socket.split();
    let sender = Arc::new(Mutex::new(sender));

    if let Err(error) = handle_socket(sender.clone(), receiver, state, room_id, payload).await {
        let _ = send_error_and_close(sender, error).await;
    }
}
async fn handle_socket(
    sender: Sender,
    receiver: Receiver,
    state: Arc<AppState>,
    room_id: String,
    payload: WebSocketQuery,
) -> Result<(), AppError> {
    let room_service = state.get_room_service(&room_id).await?;
    let is_reconnecting = payload.is_reconnecting;
    let (room, player_id) = room_service.join_room(&room_id, payload).await?;

    let (player_tx, player_rx) = tokio::sync::mpsc::unbounded_channel();

    let connection_ctx = Arc::new(ConnectionContext::new(player_id.clone(), player_tx));
    handle_player_connection(room.clone(), connection_ctx.clone(), is_reconnecting).await?;

    handle_game_start(room.clone()).await;

    let send_task = spawn_send_task(sender, player_rx, connection_ctx.clone());
    let receive_task = spawn_receive_task(receiver, room.clone(), connection_ctx.clone());

    #[cfg(not(debug_assertions))]
    let heartbeat_task = spawn_heartbeat_task(connection_ctx.clone());

    #[cfg(not(debug_assertions))]
    match try_join!(heartbeat_task, send_task, receive_task) {
        Ok(_) => info!("All tasks completed successfully"),
        Err(e) => error!("One or more tasks failed: {}", e),
    }

    #[cfg(debug_assertions)]
    match try_join!(send_task, receive_task) {
        Ok(_) => info!("All tasks completed successfully"),
        Err(e) => error!("One or more tasks failed: {}", e),
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
            let current_player = room.players.lock().await[0].info.marker;
            room.game.lock().await.set_board_status(Status::InProgress);
            if current_player == Marker::O {
                room.game.lock().await.play_random_move();
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

    let player = room.get_player(&ctx.player_id).await.unwrap();
    player
        .tx
        .unwrap()
        .send(ServerMessage::PlayerUpdate {
            action: action.clone(),
            player: SerizlizedPlayer::new(player.info.marker, Some(player.id)),
        })
        .unwrap();
    let other_player = room.get_other_player(&ctx.player_id).await;
    if let Ok(player) = other_player
        && room.info.room_type == RoomType::Standard
    {
        player
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
