use crate::{
    game::{Game, Player},
    routes::ServerMessage,
};
use anyhow::{Ok, Result, anyhow};
use dashmap::DashMap;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::{Mutex, broadcast};

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(default)]
pub struct RoomInfo {
    pub id: String,
    pub name: String,
    pub is_public: bool,
    pub bot_level: Option<String>,

    #[serde(skip_serializing)]
    pub password: Option<String>,
}
#[derive(Debug)]
pub struct Room {
    pub tx: broadcast::Sender<String>,
    pub game: Arc<Mutex<Game>>,
    pub info: RoomInfo,
}

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
    ) -> Result<(Player, Arc<Room>)> {
        if let Some(room) = self.rooms.get(room_id) {
            if !(password == room.info.password) {
                return Err(anyhow!("INVALID_PASSWORD"));
            }
            if room.tx.receiver_count() >= 2
                || (room.info.bot_level.is_some() && room.tx.receiver_count() >= 1)
            {
                return Err(anyhow!("ROOM_FULL"));
            }

            let player = room.game.lock().await.add_player();
            return Ok((player, room.clone()));
        }
        Err(anyhow!("ROOM_NOT_FOUND"))
    }

    pub async fn leave(&self, room_id: &String, player: Player) -> Result<()> {
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
