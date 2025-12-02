use dashmap::DashMap;
use std::{
    net::SocketAddr,
    sync::{Arc, atomic::Ordering},
};
use tokio::sync::mpsc;
use tokio_util::sync::CancellationToken;
use tracing::{debug, info, warn};

use crate::CleanupService;
use ultimatexo_core::{
    domain::RoomRules,
    error::AppError,
    models::{PlayerAction, Room, RoomInfo, SerizlizedPlayer, ServerMessage, WebSocketQuery},
};

pub struct RoomService {
    rooms: Arc<DashMap<String, Arc<Room>>>,
    rules: Arc<dyn RoomRules>,
    cleanup_service: CleanupService,
}

impl RoomService {
    pub fn with_rules(rules: Arc<dyn RoomRules>) -> Self {
        Self {
            rooms: Arc::new(DashMap::new()),
            rules,
            cleanup_service: CleanupService::new(),
        }
    }

    pub async fn create_room(&self, mut room_info: RoomInfo) -> Result<String, AppError> {
        let room_id = self.generate_room_id();
        room_info.id = room_id.clone();
        room_info.is_protected = room_info.password.is_some();

        let (tx, rx) = mpsc::channel(32);
        let room = Arc::new(Room::new(room_info, tx));
        Room::spawn_message_broadcaster(room.clone(), rx);

        self.rooms.insert(room_id.clone(), room);
        Ok(room_id)
    }

    pub async fn join_room(
        &self,
        room_id: &str,
        payload: WebSocketQuery,
        addr: SocketAddr,
    ) -> Result<(Arc<Room>, String), AppError> {
        let room = self.get_room(room_id)?;
        let current_count = room.get_player_count();

        if payload.is_reconnecting {
            self.rules.can_reconnect_room(
                current_count,
                room.is_pending_cleanup().await,
                &payload.player_id,
            )?;
            self.handle_reconnection(room, payload.player_id.unwrap())
                .await
        } else {
            self.rules.can_join_room(
                current_count,
                &room.info.password,
                &payload.password,
                room.is_pending_cleanup().await,
            )?;
            self.handle_new_connection(room, payload.player_id, addr)
                .await
        }
    }

    pub async fn handle_player_leaving(
        &self,
        room_id: &str,
        player_id: &str,
    ) -> Result<(), AppError> {
        let room = match self.rooms.get(room_id) {
            Some(room) => room.clone(),
            None => {
                return Ok(());
            }
        };

        let remaining_count = room.player_counter.fetch_sub(1, Ordering::SeqCst) - 1;

        debug!(
            "Player {} leaving room {}. Remaining players: {}",
            player_id, room_id, remaining_count
        );

        self.cancel_pending_cleanup(&room).await;

        let has_pending_cleanup = room.deletion_token.lock().await.is_some();

        if self
            .rules
            .should_delete_room_immediately(remaining_count, has_pending_cleanup)
        {
            debug!("Immediately removing room {} per rules", room_id);
            self.cleanup_service
                .remove_room_immediately(self.rooms.clone(), room, room_id)
                .await;
        } else {
            self.handle_player_disconnect(room, player_id).await?;
        }

        Ok(())
    }

    async fn handle_player_disconnect(
        &self,
        room: Arc<Room>,
        leaving_player_id: &str,
    ) -> Result<(), AppError> {
        {
            let mut game = room.game.lock().await;
            game.set_board_status(self.rules.get_disconnect_game_state());
        }

        let disconnect_msg = ServerMessage::PlayerUpdate {
            action: PlayerAction::Disconnected,
            player: SerizlizedPlayer::new(
                room.get_player(&leaving_player_id.to_string())
                    .await
                    .unwrap()
                    .info
                    .marker,
                None,
            ),
        };

        if let Ok(opponent) = room.get_opponent(&leaving_player_id.to_string()).await
            && let Some(tx) = &opponent.tx
            && tx.send(disconnect_msg).is_err()
        {
            warn!(
                "Failed to notify other player {} of disconnect",
                opponent.id
            );
        }

        self.schedule_cleanup(room, leaving_player_id).await;

        Ok(())
    }

    async fn cancel_pending_cleanup(&self, room: &Arc<Room>) {
        if let Some(token) = room.deletion_token.lock().await.take() {
            token.cancel();
            debug!("Cancelled pending cleanup for Room {}", room.info.id);
        }
    }

    async fn schedule_cleanup(&self, room: Arc<Room>, player_id: &str) {
        let cleanup_token = CancellationToken::new();
        *room.deletion_token.lock().await = Some(cleanup_token.clone());

        self.cleanup_service
            .schedule_room_cleanup(
                player_id.to_string(),
                room.clone(),
                self.rooms.clone(),
                cleanup_token,
                self.rules.clone(),
            )
            .await;
    }

    pub fn get_public_rooms(&self, name_filter: Option<&str>) -> Vec<RoomInfo> {
        self.rooms
            .iter()
            .map(|entry| entry.value().info.clone())
            .filter(|room| room.is_public)
            .filter(|room| name_filter.is_none_or(|filter| room.name.starts_with(filter)))
            .collect()
    }

    pub fn get_room_info(&self, room_id: &str) -> Result<RoomInfo, AppError> {
        self.rooms
            .get(room_id)
            .map(|room| room.info.clone())
            .ok_or(AppError::room_not_found())
    }

    fn get_room(&self, room_id: &str) -> Result<Arc<Room>, AppError> {
        self.rooms
            .get(room_id)
            .map(|entry| entry.value().clone())
            .ok_or(AppError::room_not_found())
    }

    fn generate_room_id(&self) -> String {
        use rand::Rng;
        let mut rng = rand::rng();
        loop {
            let id = rng.random_range(10000..=99999).to_string();
            if !self.rooms.contains_key(&id) {
                return id;
            }
        }
    }

    async fn handle_reconnection(
        &self,
        room: Arc<Room>,
        player_id: String,
    ) -> Result<(Arc<Room>, String), AppError> {
        if room.get_player(&player_id).await.is_ok() {
            if let Some(token) = room.deletion_token.lock().await.take() {
                token.cancel();
            }
            info!("Player {} reconnected to room {}", player_id, room.info.id);
            room.player_counter.fetch_add(1, Ordering::SeqCst);
            Ok((room, player_id))
        } else {
            Err(AppError::player_not_found())
        }
    }

    async fn handle_new_connection(
        &self,
        room: Arc<Room>,
        player_id: Option<String>,
        addr: SocketAddr,
    ) -> Result<(Arc<Room>, String), AppError> {
        let new_player_id = room.add_player(player_id).await?;
        info!("User {} created Player {}", addr, new_player_id);
        info!("Player {} joined room {}", new_player_id, room.info.id);
        Ok((room, new_player_id))
    }
}
