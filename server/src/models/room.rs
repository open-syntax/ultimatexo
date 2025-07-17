use std::sync::{
    Arc,
    atomic::{AtomicBool, AtomicUsize, Ordering},
};

use serde::{Deserialize, Deserializer, Serialize, de};
use tokio::sync::{
    Mutex,
    mpsc::{Receiver, Sender},
};
use tokio_util::sync::CancellationToken;
use tracing::debug;
use uuid::Uuid;

use crate::{
    error::AppError,
    models::{Marker, Player, PlayerInfo, ServerMessage},
    services::GameService,
};

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(default)]
pub struct RoomInfo {
    pub id: String,
    pub name: String,
    pub is_public: bool,
    pub room_type: RoomType,
    #[serde(skip_serializing, deserialize_with = "deserialize_bot_level")]
    pub bot_level: Option<u8>,
    #[serde(skip_serializing)]
    pub password: Option<String>,
    #[serde(skip_deserializing)]
    pub is_protected: bool,
}

fn deserialize_bot_level<'de, D>(deserializer: D) -> Result<Option<u8>, D::Error>
where
    D: Deserializer<'de>,
{
    let opt = Option::<String>::deserialize(deserializer)?;

    let level = match opt.as_deref() {
        Some("Beginner") => Some(2),
        Some("Intermediate") => Some(5),
        Some("Advanced") => Some(9),
        Some(_) => return Err(de::Error::custom("InvalidBotLevel")),
        None => None,
    };

    Ok(level)
}
#[derive(Debug, Clone, Serialize, Deserialize, Hash, PartialEq)]
pub enum RoomType {
    Standard,
    BotMatch,
}

impl Default for RoomType {
    fn default() -> Self {
        Self::Standard
    }
}
impl Eq for RoomType {}

#[derive(Debug)]
pub struct Room {
    pub tx: Sender<ServerMessage>,
    pub players: Mutex<Vec<Player>>,
    pub player_counter: AtomicUsize,
    pub game: Arc<Mutex<GameService>>,
    pub info: RoomInfo,
    pub deletion_token: Mutex<Option<CancellationToken>>,
    pub is_shutdown: AtomicBool,
}

impl Room {
    pub fn new(info: RoomInfo, tx: Sender<ServerMessage>) -> Self {
        Self {
            tx,
            player_counter: AtomicUsize::new(0),
            players: Mutex::new(Vec::new()),
            info,
            game: Arc::new(Mutex::new(GameService::new())),
            deletion_token: Mutex::new(None),
            is_shutdown: AtomicBool::new(false),
        }
    }

    pub async fn add_player(&self) -> Result<Player, AppError> {
        use rand::Rng;

        if self.is_closed() {
            return Err(AppError::room_closed());
        }

        let marker = if self.player_counter.load(Ordering::Relaxed) == 0 {
            if rand::rng().random_bool(0.5) {
                Marker::O
            } else {
                Marker::X
            }
        } else {
            !self.players.lock().await[0].info.marker
        };
        let player_id = Uuid::new_v4().to_string();
        let player_info = PlayerInfo { marker };
        let player = Player::new(player_id, marker);
        self.player_counter.fetch_add(1, Ordering::SeqCst);
        self.game.lock().await.push_player(player_info);

        Ok(player)
    }

    pub async fn get_player(&self, player_id: &String) -> Result<Player, AppError> {
        if self.is_closed() {
            return Err(AppError::room_closed());
        }

        self.players
            .lock()
            .await
            .iter()
            .find(|p| p.id.as_ref() == Some(player_id))
            .cloned()
            .ok_or(AppError::player_not_found())
    }

    pub async fn get_player_mut<F, R>(&self, player_id: &String, f: F) -> Option<R>
    where
        F: FnOnce(&mut Player) -> R,
    {
        if self.is_closed() {
            return None;
        }

        let mut players = self.players.lock().await;
        players
            .iter_mut()
            .find(|p| p.id.as_ref() == Some(player_id))
            .map(f)
    }

    pub async fn get_other_player(&self, current_player_id: &String) -> Result<Player, AppError> {
        if self.is_closed() {
            return Err(AppError::room_closed());
        }

        self.players
            .lock()
            .await
            .iter()
            .find(|p| p.id.as_ref() != Some(current_player_id))
            .cloned()
            .ok_or(AppError::player_not_found())
    }

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
            .find(|p| p.id.as_ref() != Some(current_player_id))
            .map(f)
    }

    pub async fn shutdown(&self) {
        self.is_shutdown.store(true, Ordering::Relaxed);

        if let Some(token) = self.deletion_token.lock().await.as_ref() {
            token.cancel();
        }
        let _ = self.tx.send(ServerMessage::Close).await;

        self.tx.closed().await;
    }

    pub fn spawn_message_broadcaster(room: Arc<Self>, mut rx: Receiver<ServerMessage>) {
        tokio::spawn(async move {
            while let Some(msg) = rx.recv().await {
                if matches!(msg, ServerMessage::Close) {
                    break;
                }

                let players = {
                    // Lock and clone inside block to minimize lock duration
                    let guard = room.players.lock().await;
                    guard.clone()
                };

                for player in players.iter() {
                    if let Some(tx) = &player.tx {
                        if tx.send(msg.clone()).is_err() {
                            debug!("Failed to send message to player {:?}", player.id);
                        }
                    }
                }
            }
        });
    }

    pub fn is_closed(&self) -> bool {
        self.is_shutdown.load(Ordering::Relaxed)
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
        };
        let _ = self.tx.send(msg).await;
    }
}
