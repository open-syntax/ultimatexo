use crate::domain::GameEngine;
use crate::error::AppError;
use crate::models::{Board, PlayerInfo, Status};

#[derive(Debug)]
pub struct GameService(GameEngine);
impl GameService {
    pub fn new() -> Self {
        Self(GameEngine::new())
    }

    pub fn make_move(&mut self, move_str: String) -> Result<(), AppError> {
        let position = crate::utils::parse_tuple(&move_str)?;
        self.0.make_move(position)?;
        Ok(())
    }

    pub fn get_current_player(&self) -> PlayerInfo {
        self.0.state.players[0].clone()
    }

    pub fn restart_game(&mut self) {
        self.0.restart_game();
    }

    pub fn get_board_status(&self) -> Status {
        self.0.state.board.status
    }

    pub fn set_board_status(&mut self, status: Status) {
        self.0.state.board.status = status;
    }

    pub fn push_player(&mut self, player: PlayerInfo) {
        self.0.state.players.push(player);
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

    pub fn get_last_move(&self) -> String {
        self.0.state.mv.clone()
    }

    pub async fn generate_ai_move(&mut self, level: u8) -> Result<(), AppError> {
        self.0.generate_move(level).await?;
        Ok(())
    }
}
