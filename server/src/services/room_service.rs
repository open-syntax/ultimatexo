use std::sync::{Arc, atomic::Ordering};

use dashmap::DashMap;
use tokio::sync::mpsc;
use tokio_util::sync::CancellationToken;

use crate::{
    domain::RoomRules,
    error::AppError,
    models::{PlayerAction, Room, RoomInfo, ServerMessage, Status},
    services::CleanupService,
};

pub struct RoomService {
    rooms: Arc<DashMap<String, Arc<Room>>>,
    rules: Arc<dyn RoomRules>,
    cleanup_service: Arc<CleanupService>,
}

impl RoomService {
    pub fn with_rules(rules: Arc<dyn RoomRules>) -> Self {
        Self {
            rooms: Arc::new(DashMap::new()),
            rules,
            cleanup_service: Arc::new(CleanupService::new()),
        }
    }

    pub async fn create_room(&self, mut room_info: RoomInfo) -> Result<String, AppError> {
        let room_id = self.generate_room_id();
        room_info.id = room_id.clone();

        let (tx, rx) = mpsc::channel(32);
        let room = Arc::new(Room::new(room_info, tx));

        self.spawn_message_broadcaster(room.clone(), rx);

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
        let current_count = room.player_counter.load(Ordering::SeqCst);

        self.rules
            .can_join_room(&room.info, current_count, password)?;

        if let Some(existing_id) = player_id {
            self.handle_reconnection(&room, &existing_id).await
        } else {
            self.handle_new_connection(&room).await
        }
    }

    pub async fn leave_room(&self, room_id: &str, player_id: &String) -> Result<(), AppError> {
        let room = match self.rooms.get(room_id) {
            Some(room) => room,
            None => return Ok(()),
        };

        let current_count = room.player_counter.load(Ordering::SeqCst);
        let has_bot = room.info.bot_level.is_some();
        let has_pending_cleanup = room.deletion_token.lock().await.is_some();

        if self
            .rules
            .should_delete_room_immediately(current_count, has_bot, has_pending_cleanup)
        {
            self.remove_room(room_id).await;
        } else {
            self.handle_player_disconnect(&room, player_id).await?;
            self.schedule_cleanup(&room, room_id, player_id).await;
        }

        Ok(())
    }

    pub fn get_public_rooms(&self, name_filter: Option<&str>) -> Vec<RoomInfo> {
        self.rooms
            .iter()
            .map(|entry| entry.value().info.clone())
            .filter(|room| room.is_public && room.bot_level.is_none())
            .filter(|room| name_filter.map_or(true, |filter| room.name.starts_with(filter)))
            .collect()
    }

    pub fn get_room_info(&self, room_id: &str) -> Result<RoomInfo, AppError> {
        self.rooms
            .get(room_id)
            .map(|room| room.info.clone())
            .ok_or_else(|| AppError::room_not_found())
    }

    pub fn has_room(&self, room_id: &str) -> bool {
        self.rooms.contains_key(room_id)
    }

    fn get_room(&self, room_id: &str) -> Result<Arc<Room>, AppError> {
        self.rooms
            .get(room_id)
            .map(|entry| entry.value().clone())
            .ok_or_else(|| AppError::room_not_found())
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
        room: &Arc<Room>,
        player_id: &String,
    ) -> Result<(Arc<Room>, String), AppError> {
        if room.get_player(player_id).await.is_ok() {
            if let Some(token) = room.deletion_token.lock().await.take() {
                token.cancel();
            }
            tracing::info!("Player {} reconnected to room {}", player_id, room.info.id);
            Ok((room.clone(), player_id.to_string()))
        } else {
            Err(AppError::player_not_found())
        }
    }

    async fn handle_new_connection(
        &self,
        room: &Arc<Room>,
    ) -> Result<(Arc<Room>, String), AppError> {
        let current_count = room.player_counter.load(Ordering::SeqCst);
        if current_count >= 2 {
            return Err(AppError::room_full());
        }

        let new_player = room.add_player().await?;
        let new_player_id = new_player.id.clone().unwrap();

        room.players.lock().await.push(new_player);

        tracing::info!("Player {} joined room {}", new_player_id, room.info.id);
        Ok((room.clone(), new_player_id))
    }

    async fn handle_player_disconnect(
        &self,
        room: &Arc<Room>,
        player_id: &String,
    ) -> Result<(), AppError> {
        let leaving_player = room.get_player(player_id).await?;

        let mut game = room.game.lock().await;
        game.set_board_status(self.rules.get_disconnect_game_state());
        drop(game);

        let disconnect_msg = ServerMessage::PlayerUpdate {
            action: PlayerAction::PlayerDisconnected,
            player: leaving_player.clone(),
        };

        if let Ok(other_player) = room.get_other_player(player_id).await {
            if let Some(tx) = &other_player.tx {
                let _ = tx.send(disconnect_msg);
            }
        }

        Ok(())
    }

    async fn schedule_cleanup(&self, room: &Arc<Room>, room_id: &str, player_id: &str) {
        let cleanup_token = CancellationToken::new();
        *room.deletion_token.lock().await = Some(cleanup_token.clone());

        self.cleanup_service
            .schedule_room_cleanup(
                room_id.to_string(),
                player_id.to_string(),
                room.clone(),
                self.rooms.clone(),
                cleanup_token,
                self.rules.get_cleanup_timeout(),
                Status::Paused,
            )
            .await;
    }

    async fn remove_room(&self, room_id: &str) {
        if let Some((_, room)) = self.rooms.remove(room_id) {
            room.shutdown().await;
            tracing::info!("Room {} removed", room_id);
        }
    }

    fn spawn_message_broadcaster(&self, room: Arc<Room>, mut rx: mpsc::Receiver<ServerMessage>) {
        tokio::spawn(async move {
            while let Some(msg) = rx.recv().await {
                if matches!(msg, ServerMessage::Close) {
                    break;
                }

                let players = room.players.lock().await;
                for player in players.iter() {
                    if let Some(tx) = &player.tx {
                        let _ = tx.send(msg.clone());
                    }
                }
            }
        });
    }
}
