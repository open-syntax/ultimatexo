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
        dbg!("test rejoin");
        dbg!(self.rooms.len());
        let room = self
            .rooms
            .entry(room_id.to_string())
            .or_insert_with(|| {
                dbg!("test1");
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
        let player = room.game.lock().await.add_player();
        Ok((player, room))
    }

    // requires a fix (droping the active room results a deadlock)
    pub async fn leave(&self, room_id: &str, player: Player) -> Result<()> {
        if let Some(room) = self.rooms.get(room_id) {
            let is_empty = room.game.lock().await.remove_player(&player.id)?;

            let msg = ServerMessage::PlayerUpdate {
                action: "PLAYER_LEFT".to_string(),
                player,
            };
            let _ = room.tx.send(msg.to_json()?);
            dbg!("test");

            if is_empty {
                dbg!("empty");
                self.rooms.remove(room_id);
                dbg!("room vanished");
            }
        }
        Ok(())
    }
}
