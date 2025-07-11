use crate::utils::{MessageHandler, parse_message};
use axum::extract::ws::{Message, WebSocket};
use futures_util::{SinkExt, StreamExt};
use std::{sync::Arc, time::Duration};
use tokio::{
    sync::mpsc::{UnboundedReceiver, UnboundedSender},
    task::JoinHandle,
    time::interval,
};

use crate::models::{Room, ServerMessage};

pub fn spawn_heartbeat_task(
    player_tx: UnboundedSender<ServerMessage>,
    player_id: String,
) -> JoinHandle<()> {
    tokio::spawn(async move {
        let mut interval = interval(Duration::from_secs(30));
        let last_pong = Arc::new(tokio::sync::RwLock::new(std::time::Instant::now()));

        loop {
            interval.tick().await;

            let last_pong_time = *last_pong.read().await;
            if last_pong_time.elapsed() > Duration::from_secs(60) {
                let _ = player_tx.send(ServerMessage::Close);
                tracing::warn!("Player {} timed out - no pong received", player_id);
                break;
            }

            if let Err(_) = player_tx.send(ServerMessage::Ping) {
                tracing::debug!(
                    "Failed to send ping to player {} - channel closed",
                    player_id
                );
                break;
            }
        }
    })
}

pub fn spawn_send_task(
    mut sender: futures_util::stream::SplitSink<WebSocket, Message>,
    mut player_rx: UnboundedReceiver<ServerMessage>,
    player_id: String,
) -> JoinHandle<()> {
    tokio::spawn(async move {
        let last_pong = Arc::new(tokio::sync::RwLock::new(std::time::Instant::now()));

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
                ServerMessage::Close => {
                    let _ = sender.close().await;
                    break;
                }
                ServerMessage::Pong => {
                    *last_pong.write().await = std::time::Instant::now();
                    continue;
                }
                _ => msg,
            };

            let json_msg = match filtered_msg.to_json() {
                Ok(json) => json,
                Err(e) => {
                    tracing::error!("Failed to serialize message: {}", e);
                    continue;
                }
            };

            if let Err(_) = sender.send(Message::Text(json_msg.into())).await {
                tracing::debug!("WebSocket sender closed for player {}", player_id);
                break;
            }
        }
    })
}

pub fn spawn_receive_task(
    mut receiver: futures_util::stream::SplitStream<WebSocket>,
    room: Arc<Room>,
    player_id: String,
) -> JoinHandle<()> {
    tokio::spawn(async move {
        while let Some(Ok(msg)) = receiver.next().await {
            match parse_message(msg, player_id.clone()) {
                Ok(msg) => {
                    let mut message_handler = MessageHandler::new();
                    if let Err(err) = message_handler
                        .handle_client_message(msg, room.clone())
                        .await
                    {
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
                    tracing::warn!("Failed to parse message from player {}: {}", player_id, e);
                }
            }
        }
        tracing::debug!("Message receive task ended for player {}", player_id);
    })
}
