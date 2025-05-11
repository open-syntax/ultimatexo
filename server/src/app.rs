use crate::{
    game::{Game, Player},
    routes::ServerMessage,
};
use anyhow::{Ok, Result, anyhow};
use dashmap::DashMap;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::{Mutex, broadcast};

#[derive(Debug, Deserialize, Serialize)]
pub struct RoomData {
    pub is_public: bool,
    pub password: String,
}
#[derive(Debug)]
pub struct Room {
    pub tx: broadcast::Sender<String>,
    pub game: Arc<Mutex<Game>>,
    pub data: RoomData,
}

#[derive(Debug)]
pub struct RoomManager {
    pub rooms: DashMap<usize, Arc<Room>>,
}

impl RoomManager {
    pub fn new() -> Self {
        Self {
            rooms: DashMap::new(),
        }
    }

    pub async fn join(&self, room_id: &usize) -> Result<(Player, Arc<Room>)> {
        if let Some(room) = self.rooms.get(room_id) {
            let room = room.clone();
            if room.tx.receiver_count() >= 2 {
                return Err(anyhow!("ROOM_FULL"));
            }
            let player = room.game.lock().await.add_player();
            return Ok((player, room));
        }
        Err(anyhow!("ROOM_NOT_FOUND"))
    }

    pub async fn leave(&self, room_id: &usize, player: Player) -> Result<()> {
        if let Some(room) = self.rooms.get(room_id) {
            let is_empty = room.game.lock().await.remove_player(&player.id)?;

            let msg = ServerMessage::PlayerUpdate {
                action: "PLAYER_LEFT".to_string(),
                player,
            };
            let _ = room.tx.send(msg.to_json()?);

            if is_empty {
                drop(room);
                self.rooms.remove(room_id);
            }
        }
        Ok(())
    }
}
