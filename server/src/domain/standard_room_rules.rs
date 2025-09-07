use crate::{
    domain::RoomRules,
    error::AppError,
    models::{Marker, RoomInfo, Status},
};

#[derive(Default)]
pub struct StandardRoomRules;

impl RoomRules for StandardRoomRules {
    fn can_join_room(
        &self,
        room_info: &RoomInfo,
        current_player_count: usize,
        provided_password: Option<String>,
        pending_shutdown: bool,
    ) -> Result<(), AppError> {
        if current_player_count >= self.get_max_players() || pending_shutdown {
            return Err(AppError::room_full());
        }
        match (&room_info.password, &provided_password) {
            (Some(expected), Some(provided)) if expected == provided => Ok(()),
            (Some(_), Some(_)) => Err(AppError::invalid_password()),
            (Some(_), None) => Err(AppError::invalid_password()),
            (None, _) => Ok(()),
        }
    }

    fn can_reconnect_room(
        &self,
        current_player_count: usize,
        pending_shutdown: bool,
    ) -> Result<(), AppError> {
        if current_player_count < self.get_max_players() && pending_shutdown {
            return Ok(());
        }
        Err(AppError::not_allowed())
    }

    fn should_delete_room_immediately(
        &self,
        current_player_count: usize,
        _has_bot: bool,
        has_pending_cleanup: bool,
    ) -> bool {
        current_player_count < 1 || has_pending_cleanup
    }

    fn get_disconnect_game_state(&self) -> Status {
        Status::Paused
    }

    fn get_timeout_game_state(&self, leaving_player_marker: Marker) -> Status {
        Status::Won(!leaving_player_marker)
    }

    fn get_cleanup_timeout(&self) -> std::time::Duration {
        std::time::Duration::from_secs(10)
    }

    fn get_max_players(&self) -> usize {
        2
    }
}
