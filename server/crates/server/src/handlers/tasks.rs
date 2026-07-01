use super::Sender;
use crate::utils::messages::MessageHandler;
use anyhow::Result;
use axum::extract::ws::{Message, WebSocket};
use futures_util::{SinkExt, StreamExt, stream::SplitStream};
use std::sync::Arc;
#[cfg(not(debug_assertions))]
use tokio::sync::RwLock;
#[cfg(not(debug_assertions))]
use tokio::time::{Instant, interval};
use tokio::{
    sync::mpsc::{UnboundedReceiver, UnboundedSender},
    task::JoinHandle,
};
use tracing::{Instrument, debug, warn};
use ultimatexo_core::{AppError, ClientMessage, Room, ServerMessage};

#[derive(Debug)]
pub struct ConnectionContext {
    pub player_id: String,
    pub player_tx: UnboundedSender<ServerMessage>,
    #[cfg(not(debug_assertions))]
    pub last_pong: Arc<RwLock<Instant>>,
}

impl ConnectionContext {
    pub fn new(player_id: String, player_tx: UnboundedSender<ServerMessage>) -> Self {
        Self {
            player_id,
            player_tx,
            #[cfg(not(debug_assertions))]
            last_pong: Arc::new(RwLock::new(Instant::now())),
        }
    }
}

#[cfg(not(debug_assertions))]
pub fn spawn_heartbeat_task(ctx: Arc<ConnectionContext>) -> JoinHandle<()> {
    use std::env;
    use std::time::Duration;

    tokio::spawn(
        async move {
            let ping_interval_secs: u64 = env::var("WEBSOCKET_PING_INTERVAL_SECS")
                .unwrap_or_else(|_| "3".to_string())
                .parse()
                .unwrap_or(3);
            let mut interval = interval(Duration::from_secs(ping_interval_secs));

            loop {
                interval.tick().await;

                let last_pong_time = *ctx.last_pong.read().await;
                if last_pong_time.elapsed()
                    > Duration::from_secs(
                        env::var("WEBSOCKET_PONG_TIMEOUT_SECS")
                            .unwrap_or_else(|_| "10".to_string())
                            .parse()
                            .unwrap_or(10),
                    )
                {
                    warn!(player_id = %ctx.player_id, "player_timeout");
                    break;
                }
                if ctx.player_tx.send(ServerMessage::Ping).is_err() {
                    warn!(
                        player_id = %ctx.player_id,
                        "ping_send_failed"
                    );
                    break;
                }
            }
        }
        .in_current_span(),
    )
}

#[tracing::instrument(skip(sender, message_receiver, ctx), fields(player_id = %ctx.player_id))]
pub fn spawn_send_task(
    sender: Sender,
    mut message_receiver: UnboundedReceiver<ServerMessage>,
    ctx: Arc<ConnectionContext>,
) -> JoinHandle<()> {
    tokio::spawn(
        async move {
            while let Some(server_message) = message_receiver.recv().await {
                match handle_outgoing_message(server_message, sender.clone()).await {
                    Ok(should_continue) => {
                        if !should_continue {
                            break;
                        }
                    }
                    Err(e) => {
                        warn!(player_id = %ctx.player_id, error = %e, "send_message_failed");
                        let _ = sender.lock().await.send(e.to_string().into()).await;
                        break;
                    }
                }
            }
        }
        .in_current_span(),
    )
}

#[tracing::instrument(skip(receiver, room, ctx), fields(player_id = %ctx.player_id))]
pub fn spawn_receive_task(
    mut receiver: SplitStream<WebSocket>,
    room: Arc<Room>,
    ctx: Arc<ConnectionContext>,
) -> JoinHandle<()> {
    tokio::spawn(
        async move {
            let mut message_handler = MessageHandler::new();

            while let Some(message) = receiver.next().await {
                match message {
                    Ok(msg) => {
                        if let Message::Close(_) = msg {
                            break;
                        } else if let Err(e) =
                            handle_incoming_message(msg.clone(), &mut message_handler, &room, &ctx)
                                .await
                        {
                            let msg_text = match &msg {
                                Message::Text(text) => text.as_ref(),
                                _ => "<non-text>",
                            };
                            warn!(
                                player_id = %ctx.player_id,
                                message = %msg_text,
                                error = %e,
                                "message_handle_failed"
                            );
                            let _ = ctx.player_tx.send(ServerMessage::Error(e));
                        }
                    }
                    Err(e) => {
                        warn!(player_id = %ctx.player_id, error = %e, "websocket_error");
                        let _ = ctx
                            .player_tx
                            .send(ServerMessage::Error(AppError::internal_error(
                                e.to_string(),
                            )));
                        break;
                    }
                }
            }
        }
        .in_current_span(),
    )
}

async fn handle_outgoing_message(server_message: ServerMessage, sender: Sender) -> Result<bool> {
    if let ServerMessage::WebsocketMessage(Message::Close(_)) = server_message {
        return Ok(false);
    }
    let json_message = server_message.to_json().map_err(|e| {
        AppError::internal_error(format!("Failed to serialize server message: {}", e))
    })?;
    if let Err(e) = sender
        .lock()
        .await
        .send(Message::Text(json_message.into()))
        .await
    {
        warn!(error = %e, "websocket_send_failed");
        return Err(
            AppError::internal_error("Failed to send message to WebSocket".to_string()).into(),
        );
    }

    debug!("websocket_message_sent");
    Ok(true)
}

async fn handle_incoming_message(
    message: Message,
    message_handler: &mut MessageHandler,
    room: &Arc<Room>,
    ctx: &ConnectionContext,
) -> Result<(), AppError> {
    let client_message: ClientMessage = match message {
        Message::Text(text) => serde_json::from_str(&text)
            .map_err(|e| AppError::internal_error(format!("Invalid JSON message: {}", e)))?,
        _ => {
            return Err(AppError::internal_error(
                "This messages not supported".to_string(),
            ));
        }
    };

    message_handler
        .handle_client_message(client_message, room.clone(), ctx)
        .await?;
    Ok(())
}
