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
        room_info: &RoomInfo,
        current_player_count: usize,
        provided_password: Option<String>,
    ) -> Result<(), AppError> {
        if current_player_count >= 1 {
            return Err(AppError::room_full());
        }

        if room_info.is_protected {
            match (&room_info.password, &provided_password) {
                (Some(expected), Some(provided)) if expected == provided => Ok(()),
                (Some(_), _) => Err(AppError::invalid_password()),
                (None, _) => Ok(()),
            }
        } else {
            Ok(())
        }
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
