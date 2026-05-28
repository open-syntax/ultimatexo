use crate::handlers::ConnectionContext;
use std::{borrow::Cow, sync::Arc};
use tokio::task::yield_now;
use tracing::info;
use ultimatexo_core::{
    Action, AppError, ClientMessage, Marker, Room, RoomType, ServerMessage, Status,
};
use ultimatexo_services::GameAIService;

pub struct MessageHandler;

impl MessageHandler {
    pub fn new() -> Self {
        Self {}
    }

    #[tracing::instrument(skip(self, room, ctx), fields(player_id = %ctx.player_id, room_id = %room.info.id))]
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
            ClientMessage::RematchRequest { action } => {
                self.handle_game_rematch(room, ctx, action).await
            }
            ClientMessage::DrawRequest { action } => {
                self.handle_draw_request(room, ctx, action).await
            }
            ClientMessage::Resign => self.handle_resign_request(room, ctx).await,
            #[cfg(not(debug_assertions))]
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

        let sanitized = sanitize_message_content(content)?;

        let message = ServerMessage::TextMessage {
            content: sanitized,
            player: player.info,
        };

        room.tx
            .send(message)
            .await
            .map_err(|e| AppError::internal_error(format!("Failed to broadcast message: {}", e)))?;

        info!(
            player_id = %ctx.player_id,
            room_id = %room.info.id,
            "chat_message_sent"
        );

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
        room.game.lock().await.make_move(mv)?;

        let (board_state, game_status, next_board, next_player_marker) = {
            let game = room.game.lock().await;
            (
                serde_json::to_string(&game.get_board()).unwrap_or_default(),
                game.get_board_status(),
                game.get_next_board(),
                game.get_next_player().marker,
            )
        };

        info!(
            player_id = %ctx.player_id,
            room_id = %room.info.id,
            move_board = mv[0],
            move_cell = mv[1],
            board_state = %board_state,
            active_board = ?next_board,
            next_player = ?next_player_marker,
            game_status = ?game_status,
            "player_moved"
        );

        if room.info.room_type == RoomType::BotRoom
            && room
                .game
                .lock()
                .await
                .get_board_status()
                .eq(&Status::InProgress)
        {
            room.send_board().await;
            yield_now().await;
            let mut game = room.game.lock().await;
            if GameAIService::make_ai_move(&mut game, !current_player_marker)
                .await
                .is_err()
            {
                return Err(AppError::internal_error("Failed to make game move"));
            }
            drop(game);

            let (bot_board_state, bot_game_status, bot_next_board, bot_next_player_marker) = {
                let game = room.game.lock().await;
                (
                    serde_json::to_string(&game.get_board()).unwrap_or_default(),
                    game.get_board_status(),
                    game.get_next_board(),
                    game.get_next_player().marker,
                )
            };
            info!(
                room_id = %room.info.id,
                board_state = %bot_board_state,
                active_board = ?bot_next_board,
                next_player = ?bot_next_player_marker,
                game_status = ?bot_game_status,
                bot_level = ?room.info.bot_level,
                "bot_moved"
            );
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
        if game.get_board_status().eq(&Status::InProgress) {
            return Err(AppError::game_still_ongoing());
        }

        match action {
            Action::Accept => {
                if !game.has_pending_rematch() || game.is_pending_rematch_from(player_id) {
                    return Err(AppError::not_allowed());
                }
                game.rematch_game(None);
                game.clear_rematch_request();
                drop(game);
                room.tx
                    .send(ServerMessage::RematchRequest {
                        action: action.clone(),
                        player: marker,
                    })
                    .await
                    .map_err(|e| {
                        AppError::internal_error(format!("Failed to broadcast rematch: {}", e))
                    })?;
                room.send_board().await;

                info!(
                    player_id = %player_id,
                    room_id = %room.info.id,
                    action = ?action,
                    "rematch_accepted"
                );
                return Ok(());
            }

            Action::Request => match room.info.room_type {
                RoomType::Standard => {
                    if game.has_pending_rematch() {
                        return Err(AppError::not_allowed());
                    }
                    game.request_rematch(player_id.clone());
                }
                RoomType::LocalRoom => {
                    game.rematch_game(None);
                    drop(game);
                    room.send_board().await;
                    return Ok(());
                }
                RoomType::BotRoom => {
                    let difficulty = game.state.difficulty;
                    game.rematch_game(Some(difficulty));
                    drop(game);
                    room.send_board().await;
                    return Ok(());
                }
            },

            Action::Decline => {
                if !game.has_pending_rematch() {
                    return Err(AppError::not_allowed());
                }
                if game.is_pending_rematch_from(player_id) {
                    return Err(AppError::not_allowed());
                }
                game.clear_rematch_request();
            }
        }

        room.tx
            .send(ServerMessage::RematchRequest {
                action: action.clone(),
                player: marker,
            })
            .await
            .map_err(|e| AppError::internal_error(format!("Failed to broadcast rematch: {}", e)))?;

        info!(
            player_id = %player_id,
            room_id = %room.info.id,
            action = ?action,
            "rematch_event"
        );

        Ok(())
    }

    async fn handle_draw_request(
        &mut self,
        room: Arc<Room>,
        ctx: &ConnectionContext,
        action: Action,
    ) -> Result<(), AppError> {
        let player_id = &ctx.player_id;
        let marker = room.get_player(player_id).await?.info.marker;

        let mut game = room.game.lock().await;
        if game.get_board_status().ne(&Status::InProgress) {
            return Err(AppError::game_has_ended());
        }

        match room.info.room_type {
            RoomType::Standard => match action {
                Action::Accept => {
                    if !game.has_pending_draw() || game.is_pending_draw_from(player_id) {
                        return Err(AppError::not_allowed());
                    }
                    game.draw_game();
                    game.clear_draw_request();
                    drop(game);
                    room.tx
                        .send(ServerMessage::DrawRequest {
                            action: action.clone(),
                            player: marker,
                        })
                        .await
                        .map_err(|e| {
                            AppError::internal_error(format!("Failed to broadcast draw: {}", e))
                        })?;
                    room.send_board().await;

                    info!(
                        player_id = %player_id,
                        room_id = %room.info.id,
                        action = ?action,
                        "draw_accepted"
                    );
                    return Ok(());
                }
                Action::Request => {
                    if game.has_pending_draw() {
                        return Err(AppError::not_allowed());
                    }
                    game.request_draw(player_id.clone());
                }

                Action::Decline => {
                    if !game.has_pending_draw() {
                        return Err(AppError::not_allowed());
                    }
                    if game.is_pending_draw_from(player_id) {
                        return Err(AppError::not_allowed());
                    }
                    game.clear_draw_request();
                }
            },
            _ => {
                return Err(AppError::not_allowed());
            }
        };

        room.tx
            .send(ServerMessage::DrawRequest {
                action: action.clone(),
                player: marker,
            })
            .await
            .map_err(|e| AppError::internal_error(format!("Failed to broadcast draw: {}", e)))?;

        info!(
            player_id = %player_id,
            room_id = %room.info.id,
            action = ?action,
            "draw_event"
        );

        Ok(())
    }

    async fn handle_resign_request(
        &mut self,
        room: Arc<Room>,
        ctx: &ConnectionContext,
    ) -> Result<(), AppError> {
        let player_id = &ctx.player_id;
        let marker = match room.info.room_type {
            RoomType::LocalRoom => room.game.lock().await.get_current_player().marker,
            _ => room.get_player(player_id).await?.info.marker,
        };
        if marker == Marker::X {
            room.game
                .lock()
                .await
                .set_board_status(Status::Won(Marker::O));
            room.game.lock().await.increase_score(1);
        } else {
            room.game
                .lock()
                .await
                .set_board_status(Status::Won(Marker::X));
            room.game.lock().await.increase_score(0);
        }
        room.send_board().await;

        info!(
            player_id = %player_id,
            room_id = %room.info.id,
            marker = ?marker,
            "player_resigned"
        );

        Ok(())
    }

    #[cfg(not(debug_assertions))]
    async fn handle_pong_response(&self, ctx: &ConnectionContext) -> Result<(), AppError> {
        use tokio::time::Instant;
        let mut last_pong = ctx.last_pong.write().await;
        *last_pong = Instant::now();
        tracing::debug!(player_id = %ctx.player_id, "pong_received");

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
