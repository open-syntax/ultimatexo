use std::sync::{Arc, atomic::Ordering};

use anyhow::Result;
use dashmap::DashMap;
use tokio::sync::broadcast::Receiver;
use tokio_util::sync::CancellationToken;

use crate::{
    error::AppError,
    types::{Player, PlayerAction, ServerMessage, Status},
    utils::send_board,
};

use super::room::Room;

#[derive(Debug)]
pub struct RoomManager {
    pub rooms: DashMap<String, Arc<Room>>,
}

impl RoomManager {
    pub fn new() -> Self {
        Self {
            rooms: DashMap::new(),
        }
    }

    pub async fn join(
        &self,
        room_id: &String,
        password: Option<String>,
        player_id: Option<String>,
    ) -> Result<(Arc<Room>, Player, Receiver<ServerMessage>), AppError> {
        if let Some(room) = self.rooms.get(room_id) {
            if !(password == room.info.password) {
                return Err(AppError::invalid_password());
            }
            if room.player_counter.load(Ordering::Relaxed) >= 2 {
                return Err(AppError::room_full());
            }
            let player;
            if room.deletion_token.lock().await.is_some() && player_id.is_some() {
                let mut token_lock = room.deletion_token.lock().await;
                if let Some(token) = token_lock.take() {
                    token.cancel();
                }
                room.game.lock().await.state.board.status = Status::InProgress;

                player = room.get_player(player_id.unwrap()).await?;
            } else {
                player = room.add_player().await;
                room.players.lock().await.push(player.clone());
            }
            let rx = room.tx.subscribe();
            let msg = ServerMessage::PlayerUpdate {
                action: PlayerAction::PlayerJoined,
                player: player.clone(),
            };
            let _ = room.tx.send(msg);
            return Ok((room.clone(), player, rx));
        }
        Err(AppError::room_not_found(room_id))
    }

    pub async fn leave(&self, room_id: &String, player: Player) -> Result<()> {
        if let Some(room) = self.rooms.get(room_id) {
            let last_player =
                room.player_counter.load(Ordering::Relaxed) == 1 || room.info.bot_level.is_some();

            if !last_player {
                room.game.lock().await.state.board.status = Status::Paused;

                room.player_counter.fetch_sub(1, Ordering::Relaxed);
                let msg = ServerMessage::PlayerUpdate {
                    action: PlayerAction::PlayerDisconnected,
                    player: player.clone(),
                };
                let _ = room.tx.send(msg);

                let token = CancellationToken::new();
                {
                    let mut token_lock = room.deletion_token.lock().await;
                    *token_lock = Some(token.clone());
                }

                let room_id = room_id.clone();
                let rooms = self.rooms.clone();
                let room = room.clone();

                tokio::spawn(async move {
                    tokio::select! {
                        _ = tokio::time::sleep(std::time::Duration::from_secs(60)) => {
                            let msg = ServerMessage::PlayerUpdate {
                                action: PlayerAction::PlayerLeft,
                                player: player.clone(),
                            };
                            let _ = room.tx.send(msg);
                            room.game.lock().await.state.board.status = Status::Won(!player.info.marker);
                            send_board(&room.tx, room.game.clone()).await;
                            drop(room);
                            rooms.remove(&room_id);
                        }
                        _ = token.cancelled() => {
                        }

                    }
                });
            } else {
                drop(room);
                self.rooms.remove(room_id);
            }
        }
        Ok(())
    }
}
