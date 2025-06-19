use std::sync::{Arc, atomic::Ordering};

use anyhow::Result;
use dashmap::DashMap;
use tokio_util::sync::CancellationToken;

use crate::{
    error::AppError,
    types::{PlayerAction, ServerMessage, Status},
};

use super::room::Room;

#[derive(Debug)]
pub struct RoomManager {
    pub rooms: Arc<DashMap<String, Arc<Room>>>,
}

impl RoomManager {
    pub fn new() -> Self {
        Self {
            rooms: Arc::new(DashMap::new()),
        }
    }

    pub async fn join(
        &self,
        room_id: &String,
        password: Option<String>,
        player_id: Option<String>,
    ) -> Result<(Arc<Room>, String), AppError> {
        let room = self
            .rooms
            .get(room_id)
            .ok_or_else(|| AppError::room_not_found())?;

        if password != room.info.password {
            return Err(AppError::invalid_password());
        }

        if let Some(id) = &player_id {
            if let Ok(_) = room.get_player(&id).await {
                if let Some(token) = room.deletion_token.lock().await.take() {
                    token.cancel();
                }
                tracing::info!("Player {} reconnected to room {}", &id, room_id);
                return Ok((room.clone(), id.clone()));
            } else {
                return Err(AppError::player_not_found());
            }
        } else {
            let current_count = room.player_counter.load(Ordering::SeqCst);
            if current_count >= 2 {
                return Err(AppError::room_full());
            }

            let new_player = room.add_player().await?;
            let new_player_id = new_player.id.clone().unwrap();

            room.players.lock().await.push(new_player);
            room.player_counter
                .store(current_count + 1, Ordering::SeqCst);

            tracing::info!("Player {} connected to room {}", &new_player_id, room_id);
            return Ok((room.clone(), new_player_id));
        }
    }

    pub async fn leave(&self, room_id: &String, player_id: String) -> Result<()> {
        let room = match self.rooms.get(room_id) {
            Some(room) => room,
            None => return Ok(()),
        };

        let current_count = room.player_counter.load(Ordering::SeqCst);
        let is_last_player = current_count <= 1
            || room.info.bot_level.is_some()
            || room.deletion_token.lock().await.is_some();

        if is_last_player {
            drop(room);
            self.rooms.remove(room_id);
            tracing::info!("Room {} removed - last player left", room_id);
        } else {
            let leaving_player = room.get_player(&player_id).await?;
            room.game.lock().await.state.board.status = Status::Paused;

            let disconnect_msg = ServerMessage::PlayerUpdate {
                action: PlayerAction::PlayerDisconnected,
                player: leaving_player.clone(),
            };

            if let Ok(other_player) = room.get_other_player(&player_id).await {
                if let Some(tx) = other_player.tx {
                    let _ = tx.send(disconnect_msg);
                }
            }

            let cleanup_token = CancellationToken::new();
            *room.deletion_token.lock().await = Some(cleanup_token.clone());

            self.schedule_room_cleanup(room_id.clone(), player_id, room.clone(), cleanup_token)
                .await;
        }
        Ok(())
    }

    async fn schedule_room_cleanup(
        &self,
        room_id: String,
        player_id: String,
        room: Arc<Room>,
        cleanup_token: CancellationToken,
    ) {
        let rooms = self.rooms.clone();
        tokio::spawn(async move {
            tokio::select! {
                _ = tokio::time::sleep(std::time::Duration::from_secs(60)) => {
                    tracing::info!("Player {} timed out in room {}", player_id, room_id);

                    if !rooms.contains_key(&room_id) {
                        return;
                    }

                    if let Ok(leaving_player) = room.get_player(&player_id).await {
                        let mut game_lock = room.game.lock().await;
                        game_lock.state.board.status = Status::Won(!leaving_player.info.marker);
                        drop(game_lock);

                        let leave_msg = ServerMessage::PlayerUpdate {
                            action: PlayerAction::PlayerLeft,
                            player: leaving_player,
                        };

                        room.send_board().await;
                        let _ = room.tx.send(leave_msg).await;
                    }

                    room.shutdown().await;
                    drop(room);
                    rooms.remove(&room_id).unwrap();
                    tracing::info!("Room {} removed due to player timeout", room_id);
                }
                _ = cleanup_token.cancelled() => {}
            }
        });
    }
}
