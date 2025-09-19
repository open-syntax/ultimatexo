use crate::{
    error::AppError,
    models::{Marker, RoomInfo, Status},
};

pub trait RoomRules: Send + Sync {
    fn can_join_room(
        &self,
        room_info: &RoomInfo,
        current_player_count: usize,
        provided_password: Option<String>,
        pending_shutdown: bool,
    ) -> Result<(), AppError>;

    fn can_reconnect_room(
        &self,
        current_player_count: usize,
        pending_shutdown: bool,
        player_id: &Option<String>,
    ) -> Result<(), AppError>;

    fn should_delete_room_immediately(
        &self,
        current_player_count: usize,
        has_bot: bool,
        has_pending_cleanup: bool,
    ) -> bool;

    fn get_disconnect_game_state(&self) -> Status;

    fn get_timeout_game_state(&self, leaving_player_marker: Marker) -> Status;

    fn get_cleanup_timeout(&self) -> std::time::Duration;

    fn get_max_players(&self) -> usize;
}
