use crate::error::AppError;
use crate::models::{ClientMessage, RestartAction, Room, ServerMessage};
use crate::services::game_service::GameService;
use anyhow::Context;
use axum::extract::ws::Message;
use std::sync::Arc;

pub struct MessageHandler {}

impl MessageHandler {
    pub fn new() -> Self {
        Self {}
    }

    pub async fn handle_client_message(
        &mut self,
        message: ClientMessage,
        room: Arc<Room>,
    ) -> Result<(), AppError> {
        match message {
            ClientMessage::TextMessage { content, player_id } => {
                Self::handle_text_message(room, content, player_id).await
            }
            ClientMessage::GameUpdate { mv, player_id } => {
                Self::handle_game_update(room, mv, player_id).await
            }
            ClientMessage::GameRestart { action } => Self::handle_game_restart(room, action).await,
            ClientMessage::Close(player_id) => Self::handle_close(room, &player_id).await,
            ClientMessage::Pong(player_id) => Self::handle_pong(room, &player_id).await,
        }
    }

    async fn handle_text_message(
        room: Arc<Room>,
        content: String,
        player_id: String,
    ) -> Result<(), AppError> {
        let player = room.get_player(&player_id).await?;
        let msg = ServerMessage::TextMessage {
            content,
            player: player.info,
        };
        let _ = room.tx.send(msg).await;
        Ok(())
    }

    async fn handle_game_update(
        room: Arc<Room>,
        mv: String,
        player_id: String,
    ) -> Result<(), AppError> {
        let player = room.get_player(&player_id).await?;
        let current_player_marker = room.game.lock().await.get_current_player().marker;

        if player.info.marker != current_player_marker {
            return Err(AppError::not_player_turn());
        }

        room.game.lock().await.make_move(mv)?;

        if let Some(bot_level) = room.info.bot_level {
            room.game.lock().await.generate_ai_move(bot_level).await?;
        }

        room.send_board().await;
        Ok(())
    }

    async fn handle_game_restart(room: Arc<Room>, action: RestartAction) -> Result<(), AppError> {
        match action {
            RestartAction::Accept => {
                room.game.lock().await.restart_game();
            }
            _ => {}
        }

        let msg = ServerMessage::GameRestart { action };
        let _ = room.tx.send(msg).await;
        Ok(())
    }

    async fn handle_close(room: Arc<Room>, player_id: &String) -> Result<(), AppError> {
        let _ = room
            .get_player(&player_id)
            .await
            .unwrap()
            .tx
            .unwrap()
            .send(ServerMessage::Close);
        Ok(())
    }
    async fn handle_pong(room: Arc<Room>, player_id: &String) -> Result<(), AppError> {
        let _ = room
            .get_player(&player_id)
            .await
            .unwrap()
            .tx
            .unwrap()
            .send(ServerMessage::Pong);
        Ok(())
    }
}
pub fn parse_message(message: Message, player_id: String) -> Result<ClientMessage, AppError> {
    match message {
        Message::Text(text) => serde_json::from_str(&text)
            .map_err(|e| AppError::internal_error(format!("Invalid JSON: {}", e))),
        Message::Close(_) => Ok(ClientMessage::Close(player_id)),
        _ => Err(AppError::internal_error(
            "Unsupported message type".to_string(),
        )),
    }
}
pub fn parse_tuple(s: &str) -> Result<(usize, usize), AppError> {
    let trimmed = s.trim();

    if trimmed.is_empty() {
        return Err(AppError::internal_error("Input cannot be empty"));
    }

    let (a_str, b_str) = trimmed
        .split_once(',')
        .ok_or(AppError::internal_error("Expected format: 'number,number'"))?;

    let a = a_str
        .trim()
        .parse::<usize>()
        .with_context(|| format!("Failed to parse '{}' as first number", a_str.trim()))?;

    let b = b_str
        .trim()
        .parse::<usize>()
        .with_context(|| format!("Failed to parse '{}' as second number", b_str.trim()))?;

    Ok((a, b))
}
