use std::sync::Arc;

use anyhow::{Context, Result};
use axum::extract::ws::Message;

use crate::{
    error::AppError,
    room::room::Room,
    types::{ClientMessage, RestartAction, ServerMessage},
};

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

pub async fn handle_event(event: ClientMessage, room: Arc<Room>) -> Result<(), AppError> {
    match event {
        ClientMessage::TextMessage { content, player_id } => {
            let player = room.get_player(&player_id).await.unwrap();
            let _ = room
                .tx
                .send(ServerMessage::TextMessage {
                    content,
                    player: player.info,
                })
                .await;
        }
        ClientMessage::GameUpdate { mv, player_id } => {
            if !room.game.lock().await.state.players[0].marker
                == room.get_player(&player_id).await.unwrap().info.marker
            {
                return Err(AppError::not_player_turn());
            }
            room.game.lock().await.state.mv = mv;
            room.game.lock().await.make_move()?;

            if room.info.bot_level.is_some() {
                room.game
                    .lock()
                    .await
                    .generate_move(room.info.bot_level.unwrap());
            }
            room.send_board().await;
        }
        ClientMessage::GameRestart { action } => match action {
            RestartAction::Request => {
                let _ = room.tx.send(ServerMessage::GameRestart { action }).await;
            }
            RestartAction::Accept => {
                room.game.lock().await.restart_game();
                let _ = room.tx.send(ServerMessage::GameRestart { action }).await;
            }
            RestartAction::Reject => {
                let _ = room.tx.send(ServerMessage::GameRestart { action }).await;
            }
        },
    }
    Ok(())
}

pub fn parse_message(message: Message) -> Result<ClientMessage, AppError> {
    match message {
        Message::Text(text) => serde_json::from_str(&text)
            .map_err(|e| AppError::internal_error(format!("Invalid JSON: {}", e))),
        _ => Err(AppError::internal_error(
            "Unsupported message type".to_string(),
        )),
    }
}
