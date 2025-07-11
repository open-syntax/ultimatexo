use crate::models::{PlayerAction, Room, ServerMessage, Status};
use dashmap::DashMap;
use std::sync::Arc;
use tokio_util::sync::CancellationToken;

pub struct CleanupService;

impl CleanupService {
    pub fn new() -> Self {
        Self
    }

    pub async fn schedule_room_cleanup(
        &self,
        room_id: String,
        player_id: String,
        room: Arc<Room>,
        rooms: Arc<DashMap<String, Arc<Room>>>,
        cleanup_token: CancellationToken,
        timeout_duration: std::time::Duration,
        timeout_game_state: Status,
    ) {
        tokio::spawn(async move {
            tokio::select! {
                _ = tokio::time::sleep(timeout_duration) => {
                    Self::handle_cleanup_timeout(
                        room_id,
                        player_id,
                        room,
                        rooms,
                        timeout_game_state
                    ).await;
                }
                _ = cleanup_token.cancelled() => {
                    tracing::info!("Cleanup cancelled for room {}", room_id);
                }
            }
        });
    }

    async fn handle_cleanup_timeout(
        room_id: String,
        player_id: String,
        room: Arc<Room>,
        rooms: Arc<DashMap<String, Arc<Room>>>,
        timeout_game_state: Status,
    ) {
        tracing::info!("Player {} timed out in room {}", player_id, room_id);

        if !rooms.contains_key(&room_id) {
            return;
        }

        if let Ok(leaving_player) = room.get_player(&player_id).await {
            let mut game_lock = room.game.lock().await;
            game_lock.set_board_status(timeout_game_state);
            drop(game_lock);

            let leave_msg = ServerMessage::PlayerUpdate {
                action: PlayerAction::PlayerLeft,
                player: leaving_player,
            };

            room.send_board().await;
            let _ = room.tx.send(leave_msg).await;
        }

        room.shutdown().await;
        rooms.remove(&room_id);
        tracing::info!("Room {} removed due to player timeout", room_id);
    }
}
