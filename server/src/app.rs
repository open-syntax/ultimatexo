use crate::{
    game::{Game, Player},
    routes::ServerMessage,
};
use anyhow::{Ok, Result, anyhow};
use dashmap::DashMap;
use std::sync::Arc;
use tokio::sync::{Mutex, broadcast};

#[derive(Debug)]
pub struct Room {
    pub tx: broadcast::Sender<String>,
    pub game: Arc<Mutex<Game>>,
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

    pub async fn join(&self, room_id: &String) -> Result<(Player, Arc<Room>)> {
        let room = self
            .rooms
            .entry(room_id.to_string())
            .or_insert_with(|| {
                let (tx, _) = broadcast::channel(100);
                Arc::new(Room {
                    tx,
                    game: Arc::new(Mutex::new(Game::new())),
                })
            })
            .clone();

        if room.tx.receiver_count() >= 2 {
            return Err(anyhow!("ROOM_FULL"));
        }
        let player = {
            let mut game = room.game.lock().await;
            game.add_player()
        };
        Ok((player, room))
    }

    pub async fn leave(&self, room_id: &str, player: Player) -> Result<()> {
        if let Some(room) = self.rooms.get(room_id) {
            {
                let mut game = room.game.lock().await;
                game.remove_player(&player.id)?;
            }

            let msg = ServerMessage::PlayerUpdate {
                action: "PLAYER_LEFT".to_string(),
                player,
            };
            let _ = room.tx.send(serde_json::to_string(&msg).unwrap());

            if room.tx.receiver_count() <= 1 {
                self.rooms.remove(room_id);
            }
        }
        Ok(())
    }
}
