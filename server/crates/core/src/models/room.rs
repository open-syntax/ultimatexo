use crate::{
    domain::GameEngine,
    error::AppError,
    models::{Marker, Player, PlayerInfo, ServerMessage},
};
use rand::Rng;
use serde::{Deserialize, Serialize};
use std::{
    env,
    sync::{
        Arc,
        atomic::{AtomicUsize, Ordering},
    },
};
use tokio::sync::{
    Mutex,
    mpsc::{Receiver, Sender},
};
use tokio_util::sync::CancellationToken;
use tracing::debug;
use utoipa::ToSchema;

#[derive(Debug, Clone, Default, Deserialize, Serialize, ToSchema)]
#[serde(default)]
pub struct RoomInfo {
    pub id: String,
    pub name: String,
    pub is_public: bool,
    pub room_type: RoomType,
    #[serde(skip_serializing)]
    pub bot_level: Option<BotLevel>,
    #[serde(skip_serializing)]
    pub password: Option<String>,
    #[serde(skip_deserializing)]
    pub is_protected: bool,
}

#[derive(Debug, Clone, Deserialize)]
pub enum BotLevel {
    Beginner,
    Intermediate,
    Advanced,
}

#[derive(Debug, Clone, Serialize, Deserialize, Hash, PartialEq, Eq, Default, ToSchema)]
pub enum RoomType {
    #[default]
    Standard,
    BotRoom,
    LocalRoom,
}

#[derive(Debug)]
pub struct Room {
    pub tx: Sender<ServerMessage>,
    pub players: Mutex<Vec<Player>>,
    pub player_counter: AtomicUsize,
    pub game: Arc<Mutex<GameEngine>>,
    pub info: RoomInfo,
    pub deletion_token: Mutex<Option<CancellationToken>>,
}

impl Room {
    pub fn new(info: RoomInfo, tx: Sender<ServerMessage>) -> Self {
        let begginer_difficulity = env::var("BOT_BEGINNER_DIFFICULTY")
            .ok()
            .and_then(|val| val.parse::<u8>().ok())
            .unwrap_or(1);
        let intermediate_difficulity = env::var("BOT_INTERMEDIATE_DIFFICULTY")
            .ok()
            .and_then(|val| val.parse::<u8>().ok())
            .unwrap_or(4);
        let advanced_difficulity = env::var("BOT_ADVANCED_DIFFICULTY")
            .ok()
            .and_then(|val| val.parse::<u8>().ok())
            .unwrap_or(7);

        let difficulty = match info.bot_level {
            Some(BotLevel::Beginner) => Some(begginer_difficulity),
            Some(BotLevel::Intermediate) => Some(intermediate_difficulity),
            Some(BotLevel::Advanced) => Some(advanced_difficulity),
            None => None,
        };
        Self {
            tx,
            player_counter: AtomicUsize::new(0),
            players: Mutex::new(Vec::new()),
            info,
            game: Arc::new(Mutex::new(GameEngine::new(difficulty))),
            deletion_token: Mutex::new(None),
        }
    }

    pub async fn add_bot(&self, marker: Marker) -> Result<(), AppError> {
        let player = Player::new(None, marker);
        self.game.lock().await.push_player(player.info.clone());
        self.players.lock().await.push(player);
        Ok(())
    }

    pub fn get_player_count(&self) -> usize {
        self.player_counter.load(Ordering::SeqCst)
    }

    pub async fn add_player(&self, player_id: Option<String>) -> Result<String, AppError> {
        let marker = if self.get_player_count() == 0 {
            if rand::rng().random_bool(0.5) {
                Marker::O
            } else {
                Marker::X
            }
        } else {
            !self.players.lock().await[0].info.marker
        };

        let player = Player::new(player_id, marker);
        let player_id = player.id.clone();
        self.player_counter.fetch_add(1, Ordering::SeqCst);
        self.game.lock().await.push_player(player.info.clone());
        self.players.lock().await.push(player);
        match self.info.room_type {
            RoomType::Standard => {}
            RoomType::BotRoom => {
                self.add_bot(!marker).await?;
            }
            RoomType::LocalRoom => {
                self.game.lock().await.push_player(PlayerInfo::new(!marker));
            }
        };
        Ok(player_id)
    }

    pub async fn get_player(&self, player_id: &String) -> Result<Player, AppError> {
        self.players
            .lock()
            .await
            .iter()
            .find(|p| p.id == *player_id)
            .cloned()
            .ok_or(AppError::player_not_found())
    }

    #[allow(dead_code)]
    pub async fn get_player_mut<F, R>(&self, player_id: &String, f: F) -> Option<R>
    where
        F: FnOnce(&mut Player) -> R,
    {
        let mut players = self.players.lock().await;
        players.iter_mut().find(|p| p.id == *player_id).map(f)
    }

    pub async fn get_opponent(&self, current_player_id: &String) -> Result<Player, AppError> {
        self.players
            .lock()
            .await
            .iter()
            .find(|p| p.id != *current_player_id)
            .cloned()
            .ok_or(AppError::player_not_found())
    }

    #[allow(dead_code)]
    pub async fn get_opponent_mut<F, R>(&self, current_player_id: &String, f: F) -> Option<R>
    where
        F: FnOnce(&mut Player) -> R,
    {
        let mut players = self.players.lock().await;
        players
            .iter_mut()
            .find(|p| p.id != *current_player_id)
            .map(f)
    }

    pub async fn is_pending_cleanup(&self) -> bool {
        let guard = self.deletion_token.lock().await;
        guard.is_some()
    }

    pub fn spawn_message_broadcaster(room: Arc<Self>, mut rx: Receiver<ServerMessage>) {
        tokio::spawn(async move {
            while let Some(msg) = rx.recv().await {
                let players = {
                    let guard = room.players.lock().await;
                    guard.clone()
                };

                for player in players.iter() {
                    if let Some(tx) = &player.tx
                        && tx.send(msg.clone()).is_err()
                    {
                        debug!("Failed to send message to player {:?}", player.id);
                    }
                }
            }
        });
    }

    pub async fn get_board_message(&self) -> ServerMessage {
        let game = self.game.lock().await;
        ServerMessage::GameUpdate {
            board: game.get_board(),
            next_player: game.get_next_player(),
            next_board: game.get_next_board(),
            last_move: game.get_last_move(),
            score: game.get_score(),
        }
    }

    pub async fn send_board(&self) {
        let msg = self.get_board_message().await;
        let _ = self.tx.send(msg).await;
    }
}
