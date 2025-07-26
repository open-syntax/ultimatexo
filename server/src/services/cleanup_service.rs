use std::sync::Arc;

use dashmap::DashMap;
use tokio_util::sync::CancellationToken;
use tracing::{debug, info, warn};

use crate::models::{PlayerAction, Room, ServerMessage, Status};

pub struct CleanupService;

impl CleanupService {
    pub fn new() -> Self {
        Self
    }

    pub async fn schedule_room_cleanup(
        &self,
        room_id: String,
        disconnected_player_id: String,
        room: Arc<Room>,
        rooms: Arc<DashMap<String, Arc<Room>>>,
        cleanup_token: CancellationToken,
        timeout_duration: std::time::Duration,
        timeout_game_state: Status,
    ) {
        info!(
            "Scheduling cleanup for room {} in {:?}",
            room_id, timeout_duration
        );

        tokio::spawn(async move {
            tokio::select! {
                _ = tokio::time::sleep(timeout_duration) => {
                    Self::execute_timeout_cleanup(
                        room_id,
                        disconnected_player_id,
                        room,
                        rooms,
                        timeout_game_state
                    ).await;
                }
                _ = cleanup_token.cancelled() => {
                    info!("Cleanup cancelled for room {} (player likely reconnected)", room_id);
                }
            }
        });
    }

    async fn execute_timeout_cleanup(
        room_id: String,
        disconnected_player_id: String,
        room: Arc<Room>,
        rooms: Arc<DashMap<String, Arc<Room>>>,
        timeout_game_state: Status,
    ) {
        info!(
            "Executing timeout cleanup for room {} (player {} timed out)",
            room_id, disconnected_player_id
        );

        if !rooms.contains_key(&room_id) {
            debug!("Room {} already removed, skipping timeout cleanup", room_id);
            return;
        }

        if let Ok(timed_out_player) = room.get_player(&disconnected_player_id).await {
            {
                let mut game_lock = room.game.lock().await;
                game_lock.set_board_status(timeout_game_state);
            }

            let timeout_msg = ServerMessage::PlayerUpdate {
                action: PlayerAction::PlayerLeft,
                player: timed_out_player,
            };

            room.send_board().await;
            if let Err(_) = room.tx.send(timeout_msg).await {
                warn!("Failed to send timeout notification for room {}", room_id);
            }
        }

        room.shutdown().await;
        if rooms.remove(&room_id).is_some() {
            info!("Room {} removed due to timeout cleanup", room_id);
        } else {
            debug!(
                "Room {} was already removed during timeout cleanup",
                room_id
            );
        }
    }
}
