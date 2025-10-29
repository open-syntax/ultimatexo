use crate::utils::MessageHandler;
use ultimatexo_core::{
    AppError,
    ClientMessage, Room, ServerMessage,
};
use anyhow::Result;
use axum::extract::ws::{Message, WebSocket};
use futures_util::{SinkExt, StreamExt, stream::SplitStream};
use std::sync::{
    Arc,
    atomic::{AtomicBool, Ordering},
};
use tokio::{
    sync::mpsc::{UnboundedReceiver, UnboundedSender},
    task::JoinHandle,
};
use tracing::{error, warn};

#[cfg(not(debug_assertions))]
use tokio::{sync::RwLock, time::Instant};

use super::Sender;
pub struct ConnectionContext {
    pub player_id: String,
    pub player_tx: UnboundedSender<ServerMessage>,
    #[cfg(not(debug_assertions))]
    pub last_pong: Arc<RwLock<Instant>>,
    pub is_closing: Arc<AtomicBool>,
}

impl ConnectionContext {
    pub fn new(player_id: String, player_tx: UnboundedSender<ServerMessage>) -> Self {
        Self {
            player_id,
            player_tx,
            #[cfg(not(debug_assertions))]
            last_pong: Arc::new(RwLock::new(Instant::now())),
            is_closing: Arc::new(AtomicBool::new(false)),
        }
    }
}

#[cfg(not(debug_assertions))]
pub fn spawn_heartbeat_task(ctx: Arc<ConnectionContext>) -> JoinHandle<()> {
    use std::time::Duration;
    use tokio::time::interval;
    use tracing::debug;
    tokio::spawn(async move {
        let mut interval = interval(Duration::from_millis(300));

        loop {
            interval.tick().await;

            let last_pong_time = *ctx.last_pong.read().await;
            if last_pong_time.elapsed() > Duration::from_secs(1) {
                let _ = ctx.player_tx.send(ServerMessage::Close);
                warn!("Player {} timed out - no pong received", ctx.player_id);
                break;
            }

            if ctx.player_tx.send(ServerMessage::Ping).is_err() {
                debug!(
                    "Failed to send ping to player {} - channel closed",
                    ctx.player_id
                );
                break;
            }
        }
    })
}

pub fn spawn_send_task(
    sender: Sender,
    mut message_receiver: UnboundedReceiver<ServerMessage>,
    ctx: Arc<ConnectionContext>,
) -> JoinHandle<()> {
    tokio::spawn(async move {
        while let Some(server_message) = message_receiver.recv().await {
            if ctx.is_closing.load(Ordering::Relaxed) {
                break;
            }

            match handle_outgoing_message(server_message, sender.clone(), &ctx).await {
                Ok(should_continue) => {
                    if !should_continue {
                        break;
                    }
                }
                Err(e) => {
                    error!("Failed to send message to {}: {}", ctx.player_id, e);
                    let _ = sender.lock().await.send(e.to_string().into()).await;
                    break;
                }
            }
        }
    })
}

pub fn spawn_receive_task(
    mut receiver: SplitStream<WebSocket>,
    room: Arc<Room>,
    ctx: Arc<ConnectionContext>,
) -> JoinHandle<()> {
    tokio::spawn(async move {
        let mut message_handler = MessageHandler::new();

        while let Some(message) = receiver.next().await {
            match message {
                Ok(msg) => {
                    if let Err(e) =
                        handle_incoming_message(msg, &mut message_handler, &room, &ctx).await
                    {
                        warn!("Failed to handle message from {}: {}", ctx.player_id, e);

                        if let Err(send_err) = send_error_to_player(&room, &ctx.player_id, e).await
                        {
                            error!(
                                "Failed to send error to player {}: {}",
                                ctx.player_id, send_err
                            );
                            let _ = ctx.player_tx.send(ServerMessage::Error(send_err));
                            break;
                        }
                    }
                }
                Err(e) => {
                    warn!("WebSocket error for player {}: {}", ctx.player_id, e);
                    let _ = ctx
                        .player_tx
                        .send(ServerMessage::Error(AppError::internal_error(
                            e.to_string(),
                        )));
                    break;
                }
            }
        }
    })
}

async fn handle_outgoing_message(
    server_message: ServerMessage,
    sender: Sender,
    ctx: &ConnectionContext,
) -> Result<bool> {
    let message_to_send = match server_message {
        ServerMessage::Close => {
            ctx.is_closing
                .store(true, std::sync::atomic::Ordering::Relaxed);
            if sender
                .lock()
                .await
                .send(Message::Close(None))
                .await
                .is_err()
            {
                return Err(
                    AppError::internal_error("Failed to send close message".to_string()).into(),
                );
            }
            return Ok(false);
        }
        other => other,
    };

    let json_message = message_to_send.to_json().map_err(|e| {
        AppError::internal_error(format!("Failed to serialize server message: {}", e))
    })?;
    if let Err(e) = sender
        .lock()
        .await
        .send(Message::Text(json_message.into()))
        .await
    {
        error!("Failed to send message to WebSocket: {}", e);
        return Err(
            AppError::internal_error("Failed to send message to WebSocket".to_string()).into(),
        );
    }

    Ok(true)
}

async fn handle_incoming_message(
    message: Message,
    message_handler: &mut MessageHandler,
    room: &Arc<Room>,
    ctx: &ConnectionContext,
) -> Result<(), AppError> {
    let client_message = parse_websocket_message(message)?;

    message_handler
        .handle_client_message(client_message, room.clone(), ctx)
        .await?;
    Ok(())
}

fn parse_websocket_message(message: Message) -> Result<ClientMessage, AppError> {
    match message {
        Message::Text(text) => serde_json::from_str(&text)
            .map_err(|e| AppError::internal_error(format!("Invalid JSON message: {}", e))),
        Message::Close(_) => Ok(ClientMessage::Close),
        _ => Err(AppError::internal_error(
            "This messages not supported".to_string(),
        )),
    }
}

async fn send_error_to_player(
    room: &Arc<Room>,
    player_id: &String,
    error: AppError,
) -> Result<(), AppError> {
    let player = room.get_player(player_id).await.map_err(|e| {
        AppError::internal_error(format!("Player not found when sending error: {}", e))
    })?;

    let error_message = ServerMessage::Error(error);

    if let Some(tx) = player.tx
        && let Err(e) = tx.send(error_message)
    {
        error!("Failed to send error message to player: {}", e);
        return Err(AppError::internal_error(
            "Failed to send error message to player".to_string(),
        ));
    }

    Ok(())
}
