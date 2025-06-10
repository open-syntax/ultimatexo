use std::sync::{
    Arc,
    atomic::{AtomicU8, Ordering},
};

use tokio::sync::Mutex;
use tokio_util::sync::CancellationToken;
use uuid::Uuid;

use crate::{
    error::AppError,
    game::game::Game,
    types::{Marker, Player, PlayerInfo, RoomInfo, ServerMessage},
};

#[derive(Debug)]
pub struct Room {
    pub players: Mutex<Vec<Player>>,
    pub player_counter: AtomicU8,
    pub game: Arc<Mutex<Game>>,
    pub info: RoomInfo,
    pub deletion_token: Mutex<Option<CancellationToken>>,
}

impl Room {
    pub fn new(info: RoomInfo) -> Self {
        Self {
            player_counter: AtomicU8::new(0),
            players: Mutex::new(Vec::new()),
            game: Arc::new(Mutex::new(Game::new())),
            info,
            deletion_token: Mutex::new(None),
        }
    }
    pub async fn add_player(&self) -> Player {
        let marker = if self.player_counter.load(Ordering::Relaxed) == 1 {
            Marker::O
        } else {
            Marker::X
        };

        let player_id = Uuid::new_v4().to_string();
        let player_info = PlayerInfo { marker };

        let player = Player::new(player_id, marker);

        self.player_counter.fetch_add(1, Ordering::Relaxed);

        self.game.lock().await.state.players.push(player_info);
        player
    }

    pub async fn get_player(&self, player_id: String) -> Result<Player, AppError> {
        self.players
            .lock()
            .await
            .iter()
            .find(|p| p.id == Some(player_id.clone()))
            .cloned()
            .ok_or_else(|| AppError::player_not_found())
    }

    pub async fn get_other_player(&self, player_id: String) -> Result<Player, AppError> {
        self.players
            .lock()
            .await
            .iter()
            .find(|p| p.id != Some(player_id.clone()))
            .cloned()
            .ok_or_else(|| AppError::player_not_found())
    }

    pub async fn send_board(&self) {
        let game = self.game.lock().await;
        let msg = ServerMessage::GameUpdate {
            board: game.state.board.clone(),
            next_player: game.state.players[0].clone(),
            next_board: game.state.next_board,
            last_move: game.state.mv.clone(),
        };
        let _ = self.send(msg).await;
    }

    pub async fn send(&self, msg: ServerMessage) {
        let players = self.players.lock().await;
        for player in players.iter() {
            if let Some(tx) = player.tx.get() {
                let _ = tx.send(msg.clone());
            }
        }
    }
}
