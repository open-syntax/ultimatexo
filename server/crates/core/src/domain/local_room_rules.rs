use crate::{
    domain::RoomRules,
    error::AppError,
    models::{Marker, Status},
};

#[derive(Default)]
pub struct LocalRoomRules;

impl RoomRules for LocalRoomRules {
    fn can_join_room(
        &self,
        current_player_count: usize,
        _room_password: &Option<String>,
        _provided_password: &Option<String>,
        pending_shutdown: bool,
    ) -> Result<(), AppError> {
        if current_player_count >= self.get_max_players() || pending_shutdown {
            return Err(AppError::room_full());
        }
        Ok(())
    }

    fn can_reconnect_room(
        &self,
        current_player_count: usize,
        pending_shutdown: bool,
        player_id: &Option<String>,
    ) -> Result<(), AppError> {
        if current_player_count < self.get_max_players() && pending_shutdown && player_id.is_some()
        {
            return Ok(());
        }
        Err(AppError::not_allowed())
    }

    fn should_delete_room_immediately(
        &self,
        _current_player_count: usize,
        _has_pending_cleanup: bool,
    ) -> bool {
        false
    }

    fn get_disconnect_game_state(&self) -> Status {
        Status::Paused
    }

    fn get_timeout_game_state(&self, _leaving_player_marker: Marker) -> Status {
        Status::Draw
    }

    fn get_cleanup_timeout(&self) -> std::time::Duration {
        std::time::Duration::from_secs(30)
    }

    fn get_max_players(&self) -> usize {
        1
    }
}
