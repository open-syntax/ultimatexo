use crate::{
    error::AppError,
    game::game::Game,
    types::{Marker, Player, PlayerInfo, RoomInfo, ServerMessage},
};
use std::{
    ops::Not,
    sync::{
        Arc,
        atomic::{AtomicBool, AtomicU8, Ordering},
    },
};
use tokio::sync::{Mutex, OnceCell, mpsc::Sender};
use tokio_util::sync::CancellationToken;
use uuid::Uuid;

#[derive(Debug)]
pub struct Room {
    pub tx: Sender<ServerMessage>,
    pub players: Mutex<Vec<Player>>,
    pub player_counter: AtomicU8,
    pub game: Arc<Mutex<Game>>,
    pub info: RoomInfo,
    pub deletion_token: Mutex<Option<CancellationToken>>,
    pub is_shutdown: AtomicBool,
}

impl Room {
    pub fn new(info: RoomInfo, tx: Sender<ServerMessage>) -> Self {
        Self {
            tx,
            player_counter: AtomicU8::new(0),
            players: Mutex::new(Vec::new()),
            game: Arc::new(Mutex::new(Game::new())),
            info,
            deletion_token: Mutex::new(None),
            is_shutdown: AtomicBool::new(false),
        }
    }

    pub async fn add_player(&self) -> Result<Player, AppError> {
        if self.is_closed() {
            return Err(AppError::room_closed());
        }

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

        self.tx.closed().await;
    }

    pub fn is_closed(&self) -> bool {
        self.is_shutdown.load(Ordering::Relaxed)
    }

    pub async fn send_board(&self) {
        if self.is_closed() {
            return; // Don't send if room is closed
        }

        let game = self.game.lock().await;
        let msg = ServerMessage::GameUpdate {
            board: game.state.board.clone(),
            next_player: game.state.players[0].clone(),
            next_board: game.state.next_board,
            last_move: game.state.mv.clone(),
        };
        let _ = self.tx.send(msg).await;
    }
}
