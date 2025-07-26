use crate::{error::AppError, models::ClientMessage, utils::MessageHandler};
use anyhow::Result;
use axum::extract::ws::{Message, WebSocket};
use futures_util::{
    SinkExt, StreamExt,
    stream::{SplitSink, SplitStream},
};
use std::{
    sync::{
        Arc,
        atomic::{AtomicBool, Ordering},
    },
    time::Duration,
};
use tokio::{
    sync::{
        RwLock,
        mpsc::{UnboundedReceiver, UnboundedSender},
    },
    task::JoinHandle,
    time::{Instant, interval},
};
use tracing::{debug, error, warn};

use crate::models::{Room, ServerMessage};
pub struct ConnectionContext {
    pub player_id: String,
    player_tx: UnboundedSender<ServerMessage>,
    pub last_pong: Arc<RwLock<Instant>>,
    is_closing: Arc<AtomicBool>,
}

impl ConnectionContext {
    pub fn new(player_id: String, player_tx: UnboundedSender<ServerMessage>) -> Self {
        Self {
            player_id,
            player_tx,
            last_pong: Arc::new(RwLock::new(Instant::now())),
            is_closing: Arc::new(AtomicBool::new(false)),
        }
    }
}

pub fn spawn_heartbeat_task(ctx: Arc<ConnectionContext>) -> JoinHandle<()> {
    tokio::spawn(async move {
        let mut interval = interval(Duration::from_secs(30));

        loop {
            interval.tick().await;

            let last_pong_time = *ctx.last_pong.read().await;
            dbg!(last_pong_time.elapsed());
            if last_pong_time.elapsed() > Duration::from_secs(60) {
                let _ = ctx.player_tx.send(ServerMessage::Close);
                warn!("Player {} timed out - no pong received", ctx.player_id);
                break;
            }

            if let Err(_) = ctx.player_tx.send(ServerMessage::Ping) {
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
    mut sender: SplitSink<WebSocket, Message>,
    mut message_receiver: UnboundedReceiver<ServerMessage>,
    ctx: Arc<ConnectionContext>,
) -> Result<JoinHandle<Result<()>>> {
    Ok(tokio::spawn(async move {
        while let Some(server_message) = message_receiver.recv().await {
            if ctx.is_closing.load(Ordering::Relaxed) {
                break;
            }

            match handle_outgoing_message(server_message, &mut sender, &ctx).await {
                Ok(should_continue) => {
                    if !should_continue {
                        break;
                    }
                }
                Err(e) => {
                    error!("Failed to send message to {}: {}", ctx.player_id, e);
                    break;
                }
            }
        }

        debug!("Send task completed for player {}", ctx.player_id);
        Ok(())
    }))
}

pub fn spawn_receive_task(
    mut receiver: SplitStream<WebSocket>,
    room: Arc<Room>,
    ctx: Arc<ConnectionContext>,
) -> Result<JoinHandle<Result<()>>> {
    Ok(tokio::spawn(async move {
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
                            break;
                        }
                    }
                }
                Err(e) => {
                    warn!("WebSocket error for player {}: {}", ctx.player_id, e);
                    break;
                }
            }
        }

        debug!("Receive task completed for player {}", ctx.player_id);
        Ok(())
    }))
}

async fn handle_outgoing_message(
    server_message: ServerMessage,
    sender: &mut SplitSink<WebSocket, Message>,
    ctx: &ConnectionContext,
) -> Result<bool> {
    let message_to_send = match server_message {
        ServerMessage::PlayerUpdate { action, player } => {
            let filtered_player = filter_player_info_for_client(player, &ctx.player_id);
            ServerMessage::PlayerUpdate {
                action,
                player: filtered_player,
            }
        }
        ServerMessage::Close => {
            ctx.is_closing
                .store(true, std::sync::atomic::Ordering::Relaxed);
            if sender.send(Message::Close(None)).await.is_err() {
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

    if let Err(e) = sender.send(Message::Text(json_message.into())).await {
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

    if let Err(e) = message_handler
        .handle_client_message(client_message, room.clone(), ctx)
        .await
    {
        error!("Failed to handle client message: {}", e);
        return Err(AppError::internal_error("Failed to handle client message".to_string()).into());
    }

    Ok(())
}

fn filter_player_info_for_client(
    mut player: crate::models::Player,
    current_player_id: &str,
) -> crate::models::Player {
    if let Some(ref id) = player.id {
        if id != current_player_id {
            player.id = None;
        }
    }
    player
}

pub fn parse_websocket_message(message: Message) -> Result<ClientMessage, AppError> {
    match message {
        Message::Text(text) => serde_json::from_str(&text)
            .map_err(|e| AppError::internal_error(format!("Invalid JSON message: {}", e))),
        Message::Close(_) => Ok(ClientMessage::Close),
        _ => Err(AppError::internal_error(
            "This messages not supported".to_string(),
        )),
    }
}

async fn send_error_to_player(room: &Arc<Room>, player_id: &String, error: AppError) -> Result<()> {
    let player = room.get_player(player_id).await.map_err(|e| {
        AppError::internal_error(format!("Player not found when sending error: {}", e))
    })?;

    let error_message = ServerMessage::Error(error);

    if let Some(tx) = player.tx {
        if let Err(e) = tx.send(error_message) {
            error!("Failed to send error message to player: {}", e);
            return Err(AppError::internal_error(
                "Failed to send error message to player".to_string(),
            )
            .into());
        }
    }

    Ok(())
}
