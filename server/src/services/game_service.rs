use crate::domain::GameEngine;
use crate::error::AppError;
use crate::models::room::BotLevel;
use crate::models::{Board, Marker, PlayerInfo, Status};

#[derive(Debug)]
pub struct GameService(GameEngine);
impl GameService {
    pub fn new() -> Self {
        Self(GameEngine::new())
    }

    pub fn make_move(&mut self, mv: [usize; 2]) -> Result<(), AppError> {
        self.0.make_move(mv)?;
        Ok(())
    }

    pub fn get_current_player(&self) -> PlayerInfo {
        self.0.state.players[0].clone()
    }

    pub fn rematch_game(&mut self) {
        self.0.rematch_game();
    }

    pub fn get_board_status(&self) -> Status {
        self.0.state.board.status
    }

    pub fn set_board_status(&mut self, status: Status) {
        self.0.state.board.status = status;
    }

    pub fn push_player(&mut self, player: PlayerInfo) {
        let marker = player.marker.clone();
        self.0.state.players.push(player);
        if self.0.state.players.len() == 2 && marker == Marker::X {
            self.0.state.toggle_players();
        }
    }

    pub fn get_board(&self) -> Board {
        self.0.state.board.clone()
    }

    pub fn get_next_player(&self) -> PlayerInfo {
        self.0.state.players[0].clone()
    }

    pub fn get_next_board(&self) -> Option<usize> {
        self.0.state.next_board
    }

    pub fn get_last_move(&self) -> Option<[usize; 2]> {
        self.0.state.last_move
    }

    pub fn has_pending_rematch(&self) -> bool {
        self.0.state.pending_rematch.is_some()
    }

    pub fn is_pending_rematch_from(&self, id: &str) -> bool {
        self.0.state.pending_rematch.as_deref() == Some(id)
    }

    pub fn request_rematch(&mut self, id: String) {
        self.0.state.pending_rematch = Some(id);
    }

    pub fn clear_rematch_request(&mut self) {
        self.0.state.pending_rematch = None;
    }

    pub fn has_pending_draw(&self) -> bool {
        self.0.state.pending_draw.is_some()
    }

    pub fn is_pending_draw_from(&self, id: &str) -> bool {
        self.0.state.pending_draw.as_deref() == Some(id)
    }

    pub fn request_draw(&mut self, id: String) {
        self.0.state.pending_draw = Some(id);
    }

    pub fn clear_draw_request(&mut self) {
        self.0.state.pending_draw = None;
    }

    pub async fn generate_ai_move(&mut self, level: BotLevel) -> Result<(), AppError> {
        self.0.generate_move(level).await?;
        Ok(())
    }
}
