use crate::{
    error::AppError,
    handlers::ConnectionContext,
    models::{Action, ClientMessage, Room, RoomType, ServerMessage, Status},
};
use std::{borrow::Cow, sync::Arc};
use tokio::time::Instant;

pub struct MessageHandler;

impl MessageHandler {
    pub fn new() -> Self {
        Self {}
    }

    pub async fn handle_client_message(
        &mut self,
        message: ClientMessage,
        room: Arc<Room>,
        ctx: &ConnectionContext,
    ) -> Result<(), AppError> {
        match message {
            ClientMessage::TextMessage { content } => {
                self.handle_text_message(room, content, ctx).await
            }
            ClientMessage::GameUpdate { mv } => self.handle_game_update(room, mv, ctx).await,
            ClientMessage::GameRestart { action } => {
                self.handle_game_rematch(room, ctx, action).await
            }
            ClientMessage::DrawRequest { action } => {
                self.handle_draw_request(room, ctx, action).await
            }
            ClientMessage::Resign => self.handle_resign_request(room, ctx).await,
            ClientMessage::Close => self.handle_close_request(room, ctx).await,
            ClientMessage::Pong => self.handle_pong_response(ctx).await,
        }
    }

    async fn handle_text_message(
        &mut self,
        room: Arc<Room>,
        content: String,
        ctx: &ConnectionContext,
    ) -> Result<(), AppError> {
        let player = room.get_player(&ctx.player_id).await?;

        let message = ServerMessage::TextMessage {
            content: sanitize_message_content(content)?,
            player: player.info,
        };

        room.tx
            .send(message)
            .await
            .map_err(|e| AppError::internal_error(format!("Failed to broadcast message: {}", e)))?;

        Ok(())
    }

    async fn handle_game_update(
        &mut self,
        room: Arc<Room>,
        mv: [usize; 2],
        ctx: &ConnectionContext,
    ) -> Result<(), AppError> {
        let player = room.get_player(&ctx.player_id).await?;

        let current_player_marker = {
            let game = room.game.lock().await;
            game.get_current_player().marker
        };

        if player.info.marker != current_player_marker && room.info.room_type != RoomType::LocalRoom
        {
            return Err(AppError::not_player_turn());
        }

        {
            let mut game = room.game.lock().await;
            if let Err(e) = game.make_move(mv) {
                return Err(AppError::internal_error(format!(
                    "Failed to make game move: {}",
                    e
                )));
            }
            if room.info.room_type == RoomType::BotRoom
                && game.apply_ai_move(!current_player_marker).await.is_none()
            {
                return Err(AppError::internal_error("Failed to make game move"));
            }
        }

        room.send_board().await;
        Ok(())
    }

    async fn handle_game_rematch(
        &mut self,
        room: Arc<Room>,
        ctx: &ConnectionContext,
        action: Action,
    ) -> Result<(), AppError> {
        let player_id = &ctx.player_id;
        let marker = room.get_player(player_id).await?.info.marker;

        let mut game = room.game.lock().await;

        match room.info.room_type {
            RoomType::Standard => match action {
                Action::Accept => {
                    if !game.has_pending_rematch() {
                        return Err(AppError::game_still_ongoing());
                    }

                    if game.is_pending_rematch_from(player_id) {
                        return Err(AppError::not_allowed());
                    }

                    game.rematch_game(None);
                    game.clear_rematch_request();
                }

                Action::Request => {
                    if game.get_board_status().eq(&Status::InProgress) {
                        return Err(AppError::game_still_ongoing());
                    }
                    game.request_rematch(player_id.clone());
                }

                Action::Decline => {
                    if !game.has_pending_rematch() {
                        return Err(AppError::game_still_ongoing());
                    }

                    if game.is_pending_rematch_from(player_id) {
                        return Err(AppError::not_allowed());
                    }
                    game.clear_rematch_request();
                }
            },
            RoomType::LocalRoom => {
                if let Action::Request = action {
                    game.rematch_game(None);
                }
            }
            RoomType::BotRoom => {
                let difficulty = game.state.difficulty;
                game.rematch_game(Some(difficulty));
                game.apply_ai_move(!marker).await;
            }
        }

        room.tx
            .send(ServerMessage::GameRestart {
                action,
                player: marker,
            })
            .await
            .map_err(|e| AppError::internal_error(format!("Failed to broadcast rematch: {}", e)))?;

        Ok(())
    }

    async fn handle_draw_request(
        &mut self,
        room: Arc<Room>,
        ctx: &ConnectionContext,
        action: Action,
    ) -> Result<(), AppError> {
        if room.info.room_type == RoomType::Standard {
            return Ok(());
        }
        let player_id = &ctx.player_id;
        let marker = room.get_player(player_id).await?.info.marker;

        let mut game = room.game.lock().await;

        match action {
            Action::Accept => {
                if !game.has_pending_draw() {
                    return Err(AppError::game_still_ongoing());
                }

                if game.is_pending_draw_from(player_id) {
                    return Err(AppError::not_allowed());
                }

                game.set_board_status(Status::Draw);
                room.send_board().await;
                game.clear_draw_request();
            }

            Action::Request => {
                if game.get_board_status().ne(&Status::InProgress) {
                    return Err(AppError::game_has_ended());
                }
                game.request_draw(player_id.clone());
            }

            Action::Decline => {
                if !game.has_pending_draw() {
                    return Err(AppError::game_still_ongoing());
                }

                if game.is_pending_draw_from(player_id) {
                    return Err(AppError::not_player_turn());
                }
                game.clear_draw_request();
            }
        }

        room.tx
            .send(ServerMessage::DrawRequest {
                action,
                player: marker,
            })
            .await
            .map_err(|e| AppError::internal_error(format!("Failed to broadcast draw: {}", e)))?;

        Ok(())
    }

    async fn handle_resign_request(
        &mut self,
        room: Arc<Room>,
        ctx: &ConnectionContext,
    ) -> Result<(), AppError> {
        let marker = room.get_player(&ctx.player_id).await?.info.marker;
        room.game
            .lock()
            .await
            .set_board_status(Status::Won(!marker));
        room.send_board().await;
        Ok(())
    }

    async fn handle_close_request(
        &mut self,
        room: Arc<Room>,
        ctx: &ConnectionContext,
    ) -> Result<(), AppError> {
        let player = room.get_player(&ctx.player_id).await?;

        if let Some(tx) = player.tx {
            tx.send(ServerMessage::Close).map_err(|_| {
                AppError::internal_error("Failed to send close message".to_string())
            })?;
        }

        Ok(())
    }

    async fn handle_pong_response(&self, ctx: &ConnectionContext) -> Result<(), AppError> {
        let mut last_pong = ctx.last_pong.write().await;
        *last_pong = Instant::now();

        Ok(())
    }
}

pub fn sanitize_message_content(content: String) -> Result<String, AppError> {
    const MAX_MESSAGE_LENGTH: usize = 10000;

    if content.len() > MAX_MESSAGE_LENGTH {
        return Err(AppError::too_long_text_message(MAX_MESSAGE_LENGTH));
    }

    let cleaned: Cow<str> = if content
        .chars()
        .any(|c| c.is_control() && c != '\n' && c != '\t')
    {
        content
            .chars()
            .filter(|&c| !c.is_control() || c == '\n' || c == '\t')
            .collect::<String>()
            .into()
    } else {
        content.into()
    };

    let normalized = cleaned
        .lines()
        .map(|line| {
            let mut result = String::new();
            let mut prev_was_space = false;

            for c in line.chars() {
                if c.is_whitespace() {
                    if !prev_was_space {
                        result.push(' ');
                        prev_was_space = true;
                    }
                } else {
                    result.push(c);
                    prev_was_space = false;
                }
            }

            result.trim().to_string()
        })
        .collect::<Vec<_>>()
        .join("\n");

    let mut final_result = String::new();
    let mut newline_count = 0;

    for c in normalized.chars() {
        if c == '\n' {
            newline_count += 1;
            if newline_count <= 2 {
                final_result.push(c);
            }
        } else {
            newline_count = 0;
            final_result.push(c);
        }
    }

    let sanitized = final_result.trim().to_string();

    if sanitized.is_empty() {
        return Err(AppError::empty_text_message());
    }

    Ok(sanitized)
}
