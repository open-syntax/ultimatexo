use dashmap::DashMap;
use std::sync::{Arc, atomic::Ordering};
use tokio::sync::mpsc;
use tokio_util::sync::CancellationToken;
use tracing::{debug, info, warn};

use crate::{
    domain::RoomRules,
    error::AppError,
    models::{PlayerAction, Room, RoomInfo, RoomType, ServerMessage},
    services::CleanupService,
};

pub struct RoomService {
    rooms: Arc<DashMap<String, Arc<Room>>>,
    rules: Arc<dyn RoomRules>,
}

impl RoomService {
    pub fn with_rules(rules: Arc<dyn RoomRules>) -> Self {
        Self {
            rooms: Arc::new(DashMap::new()),
            rules,
        }
    }

    pub async fn create_room(&self, mut room_info: RoomInfo) -> Result<String, AppError> {
        let room_id = self.generate_room_id();
        room_info.id = room_id.clone();

        let (tx, rx) = mpsc::channel(32);
        room_info.room_type = RoomType::BotRoom;
        let room = Arc::new(Room::new(room_info, tx));

        Room::spawn_message_broadcaster(room.clone(), rx);

        self.rooms.insert(room_id.clone(), room);
        Ok(room_id)
    }

    pub async fn join_room(
        &self,
        room_id: &str,
        password: Option<String>,
        player_id: Option<String>,
    ) -> Result<(Arc<Room>, String), AppError> {
        let room = self.get_room(room_id)?;
        let current_count = room.get_player_count();

        self.rules
            .can_join_room(&room.info, current_count, password)?;

        if let Some(existing_id) = player_id {
            self.handle_reconnection(room, &existing_id).await
        } else {
            self.handle_new_connection(room).await
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
                debug!("Room {} not found, already cleaned up", room_id);
                return Ok(());
            }
        };

        let remaining_count = room.player_counter.fetch_sub(1, Ordering::SeqCst) - 1;

        info!(
            "Player {} leaving room {}. Remaining players: {}",
            player_id, room_id, remaining_count
        );

        self.cancel_pending_cleanup(&room).await;

        let has_bot = room.info.bot_level.is_some();
        let has_pending_cleanup = room.deletion_token.lock().await.is_some();

        if self
            .rules
            .should_delete_room_immediately(remaining_count, has_bot, has_pending_cleanup)
        {
            info!("Immediately removing room {} per rules", room_id);
            self.remove_room_immediately(room, room_id).await;
        } else {
            self.handle_player_disconnect(&room, player_id).await?;

            if remaining_count == 1 && !has_bot {
                self.schedule_delayed_cleanup(room, player_id).await;
            }
        }

        Ok(())
    }

    async fn handle_player_disconnect(
        &self,
        room: &Arc<Room>,
        leaving_player_id: &str,
    ) -> Result<(), AppError> {
        {
            let mut game = room.game.lock().await;
            game.set_board_status(self.rules.get_disconnect_game_state());
        }

        let disconnect_msg = ServerMessage::PlayerUpdate {
            action: PlayerAction::Disconnected,
        };

        if let Ok(other_player) = room.get_other_player(&leaving_player_id.to_string()).await
            && let Some(tx) = &other_player.tx
            && tx.send(disconnect_msg).is_err()
        {
            warn!("Failed to notify other player of disconnect");
        }

        Ok(())
    }

    async fn cancel_pending_cleanup(&self, room: &Arc<Room>) {
        if let Some(token) = room.deletion_token.lock().await.take() {
            token.cancel();
            debug!("Cancelled pending cleanup for room");
        }
    }

    async fn schedule_delayed_cleanup(&self, room: Arc<Room>, player_id: &str) {
        let cleanup_token = CancellationToken::new();
        *room.deletion_token.lock().await = Some(cleanup_token.clone());

        let cleanup_service = CleanupService::new();
        cleanup_service
            .schedule_room_cleanup(
                player_id.to_string(),
                room.clone(),
                self.rooms.clone(),
                cleanup_token,
                self.rules.clone(),
            )
            .await;
    }

    async fn remove_room_immediately(&self, room: Arc<Room>, room_id: &str) {
        if let Some(token) = room.deletion_token.lock().await.take() {
            token.cancel();
        }

        if let Some((_, removed_room)) = self.rooms.remove(room_id) {
            removed_room.shutdown().await;
            info!("Room {} immediately removed", room_id);
        } else {
            debug!("Room {} was already removed", room_id);
        }
    }

    pub fn get_public_rooms(&self, name_filter: Option<&str>) -> Vec<RoomInfo> {
        self.rooms
            .iter()
            .map(|entry| entry.value().info.clone())
            .filter(|room| room.is_public && room.bot_level.is_none())
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
        player_id: &String,
    ) -> Result<(Arc<Room>, String), AppError> {
        if room.get_player(player_id).await.is_ok() {
            if let Some(token) = room.deletion_token.lock().await.take() {
                token.cancel();
            }
            tracing::info!("Player {} reconnected to room {}", player_id, room.info.id);
            Ok((room, player_id.to_string()))
        } else {
            Err(AppError::player_not_found())
        }
    }

    async fn handle_new_connection(
        &self,
        room: Arc<Room>,
    ) -> Result<(Arc<Room>, String), AppError> {
        let current_count = room.get_player_count();
        if current_count >= 2 {
            return Err(AppError::room_full());
        }

        let new_player_id = room.add_player().await?;
        tracing::info!("Player {} joined room {}", new_player_id, room.info.id);
        Ok((room, new_player_id))
    }
}
