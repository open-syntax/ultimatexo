use crate::{
    domain::{BotRoomRules, LocalRoomRules, StandardRoomRules},
    error::AppError,
    models::{RoomInfo, RoomType},
    services::RoomService,
};
use std::{collections::HashMap, sync::Arc};

pub struct AppState {
    room_services: HashMap<RoomType, Arc<RoomService>>,
    room_metadata: Arc<tokio::sync::RwLock<HashMap<String, RoomType>>>,
}

impl AppState {
    pub fn new() -> Self {
        let mut room_services = HashMap::new();

        room_services.insert(
            RoomType::Standard,
            Arc::new(RoomService::with_rules(Arc::new(StandardRoomRules))),
        );

        room_services.insert(
            RoomType::BotRoom,
            Arc::new(RoomService::with_rules(Arc::new(BotRoomRules))),
        );

        room_services.insert(
            RoomType::LocalRoom,
            Arc::new(RoomService::with_rules(Arc::new(LocalRoomRules))),
        );

        Self {
            room_services,
            room_metadata: Arc::new(tokio::sync::RwLock::new(HashMap::new())),
        }
    }

    pub async fn create_room(&self, room_info: RoomInfo) -> Result<String, AppError> {
        if room_info.room_type == RoomType::BotRoom && room_info.bot_level.is_none() {
            return Err(AppError::missing_bot_level());
        } else if room_info.room_type != RoomType::BotRoom && room_info.bot_level.is_some() {
            return Err(AppError::invalid_bot_level());
        } else if room_info.room_type == RoomType::LocalRoom && room_info.is_public {
            return Err(AppError::local_room_cannot_be_public());
        }
        let room_type = room_info.room_type.clone();
        let service = self
            .room_services
            .get(&room_type)
            .ok_or_else(AppError::unsupported_room_type)?;

        let room_id = service.create_room(room_info).await?;

        self.room_metadata
            .write()
            .await
            .insert(room_id.clone(), room_type);

        Ok(room_id)
    }

    pub async fn get_room_service(&self, room_id: &str) -> Option<Arc<RoomService>> {
        let room_type = self.room_metadata.read().await.get(room_id)?.clone();
        self.room_services.get(&room_type).cloned()
    }

    pub async fn get_public_rooms(&self, name_filter: Option<&str>) -> Vec<RoomInfo> {
        let mut all_rooms = Vec::new();

        for service in self.room_services.values() {
            all_rooms.extend(service.get_public_rooms(name_filter));
        }

        all_rooms
    }

    pub async fn get_room_info(&self, room_id: &str) -> Option<RoomInfo> {
        for service in self.room_services.values() {
            if let Ok(info) = service.get_room_info(room_id) {
                return Some(info);
            }
        }
        None
    }
}
