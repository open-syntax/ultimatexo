use crate::{
    domain::RoomRules,
    error::AppError,
    models::{Marker, RoomInfo, Status},
};

#[derive(Default)]
pub struct BotRoomRules;

impl RoomRules for BotRoomRules {
    fn can_join_room(
        &self,
        _room_info: &RoomInfo,
        current_player_count: usize,
        _provided_password: Option<String>,
        _pending_shutdown: bool,
    ) -> Result<(), AppError> {
        if current_player_count >= self.get_max_players() {
            return Err(AppError::room_full());
        }
        Ok(())
    }

    fn can_reconnect_room(
        &self,
        _current_player_count: usize,
        _pending_shutdown: bool,
        _player_id: &Option<String>,
    ) -> Result<(), AppError> {
        Err(AppError::not_allowed())
    }

    fn should_delete_room_immediately(
        &self,
        current_player_count: usize,
        _has_bot: bool,
        _has_pending_cleanup: bool,
    ) -> bool {
        current_player_count == 0
    }

    fn get_disconnect_game_state(&self) -> Status {
        Status::Paused
    }

    fn get_timeout_game_state(&self, leaving_player_marker: Marker) -> Status {
        Status::Won(leaving_player_marker)
    }

    fn get_cleanup_timeout(&self) -> std::time::Duration {
        std::time::Duration::from_secs(30)
    }

    fn get_max_players(&self) -> usize {
        1
    }
}
