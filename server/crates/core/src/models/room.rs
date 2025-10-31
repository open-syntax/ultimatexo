use crate::{
    domain::GameEngine,
    error::AppError,
    models::{Marker, Player, PlayerInfo, ServerMessage},
};
use serde::{Deserialize, Serialize};
use std::{
    sync::{
        Arc,
        atomic::{AtomicBool, AtomicUsize, Ordering},
    },
    time::Duration,
};
use tokio::{
    sync::{
        Mutex,
        mpsc::{Receiver, Sender},
    },
    time::timeout,
};
use tokio_util::sync::CancellationToken;
use tracing::{debug, info, warn};
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
    pub is_shutdown: AtomicBool,
}

impl Room {
    pub fn new(info: RoomInfo, tx: Sender<ServerMessage>) -> Self {
        let difficulty: Option<u8> = match info.bot_level.as_ref() {
            Some(BotLevel::Beginner) => Some(2),
            Some(BotLevel::Intermediate) => Some(5),
            Some(BotLevel::Advanced) => Some(8),
            None => None,
        };
        Self {
            tx,
            player_counter: AtomicUsize::new(0),
            players: Mutex::new(Vec::new()),
            info,
            game: Arc::new(Mutex::new(GameEngine::new(difficulty))),
            deletion_token: Mutex::new(None),
            is_shutdown: AtomicBool::new(false),
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
        use rand::Rng;

        if self.is_closed() {
            return Err(AppError::room_closed());
        }

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
        if self.is_closed() {
            return Err(AppError::room_closed());
        }

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
        if self.is_closed() {
            return None;
        }

        let mut players = self.players.lock().await;
        players.iter_mut().find(|p| p.id == *player_id).map(f)
    }

    pub async fn get_other_player(&self, current_player_id: &String) -> Result<Player, AppError> {
        if self.is_closed() {
            return Err(AppError::room_closed());
        }

        self.players
            .lock()
            .await
            .iter()
            .find(|p| p.id != *current_player_id)
            .cloned()
            .ok_or(AppError::player_not_found())
    }

    #[allow(dead_code)]
    pub async fn get_other_player_mut<F, R>(&self, current_player_id: &String, f: F) -> Option<R>
    where
        F: FnOnce(&mut Player) -> R,
    {
        if self.is_closed() {
            return None;
        }

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

    pub async fn shutdown(&self) {
        if self.is_shutdown.swap(true, Ordering::Relaxed) {
            debug!("Room {} already shutting down", self.room_id());
            return;
        }

        info!("Starting shutdown for room {}", self.room_id());

        self.disconnect_all_players().await;

        self.close_broadcast_channel().await;

        info!("Room {} shutdown complete", self.room_id());
    }

    async fn disconnect_all_players(&self) {
        let close_message = ServerMessage::Close;

        if self.tx.send(close_message).await.is_err() {
            debug!(
                "Broadcast channel already closed or no receivers for room {}",
                self.room_id()
            );
        }

        tokio::time::sleep(Duration::from_millis(100)).await;
    }

    async fn close_broadcast_channel(&self) {
        const CLOSE_TIMEOUT: Duration = Duration::from_secs(5);

        match timeout(CLOSE_TIMEOUT, self.tx.closed()).await {
            Ok(_) => {
                debug!(
                    "Broadcast channel closed successfully for room {}",
                    self.room_id()
                );
            }
            Err(_) => {
                warn!(
                    "Timeout waiting for broadcast channel to close for room {}",
                    self.room_id()
                );
            }
        }
    }

    fn room_id(&self) -> String {
        self.info.id.clone()
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

                if matches!(msg, ServerMessage::Close) {
                    break;
                }
            }
        });
    }

    pub fn is_closed(&self) -> bool {
        self.is_shutdown.load(Ordering::SeqCst)
    }

    pub async fn send_board(&self) {
        if self.is_closed() {
            return;
        }

        let game = self.game.lock().await;
        let msg = ServerMessage::GameUpdate {
            board: game.get_board(),
            next_player: game.get_next_player(),
            next_board: game.get_next_board(),
            last_move: game.get_last_move(),
            score: game.get_score(),
        };
        let _ = self.tx.send(msg).await;
    }
}
