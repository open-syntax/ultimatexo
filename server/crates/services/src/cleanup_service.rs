use axum::extract::ws::Message;
use dashmap::DashMap;
use std::sync::Arc;
use tokio_util::sync::CancellationToken;
use tracing::{debug, info};
use ultimatexo_core::{
    domain::RoomRules,
    models::{PlayerAction, Room, SerizlizedPlayer, ServerMessage, Status},
};

#[derive(Default)]
pub struct CleanupService;

impl CleanupService {
    pub fn new() -> Self {
        Self
    }

    pub async fn schedule_room_cleanup(
        &self,
        disconnected_player_id: String,
        room: Arc<Room>,
        rooms: Arc<DashMap<String, Arc<Room>>>,
        cleanup_token: CancellationToken,
        game_rules: Arc<dyn RoomRules>,
    ) {
        let timeout_duration = game_rules.get_cleanup_timeout();
        let timeout_game_state = game_rules.get_timeout_game_state(
            room.get_player(&disconnected_player_id)
                .await
                .unwrap()
                .info
                .marker,
        );
        let room_id = room.info.id.clone();
        debug!(
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
                    debug!("Cleanup cancelled for room {}", room_id);
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
        debug!(
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
                action: PlayerAction::Left,
                player: SerizlizedPlayer::new(timed_out_player.info.marker, None),
            };
            let opponent_tx = room
                .get_opponent(&disconnected_player_id)
                .await
                .unwrap()
                .tx
                .unwrap();

            let board_msg = room.get_board_message().await;
            let _ = opponent_tx.send(board_msg);
            let _ = opponent_tx.send(timeout_msg);
            let _ = opponent_tx.send(ServerMessage::WebsocketMessage(Message::Close(None)));
        }
    }

    pub async fn remove_room_immediately(
        &self,
        rooms: Arc<DashMap<String, Arc<Room>>>,
        room: Arc<Room>,
        room_id: &str,
    ) {
        if let Some(token) = room.deletion_token.lock().await.take() {
            token.cancel();
        }
        if rooms.remove(room_id).is_some() {
            info!("Room {} removed", room_id);
        } else {
            debug!("Room {} doesnt Exist", room_id);
        }
    }
}
