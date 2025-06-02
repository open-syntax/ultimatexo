use std::sync::Arc;

use anyhow::{Context, Result};
use axum::extract::ws::Message;
use tokio::sync::{Mutex, broadcast::Sender};

use crate::{
    error::AppError,
    game::game::Game,
    room::room::Room,
    types::{ClientMessage, RestartAction, ServerMessage},
};

pub fn parse_tuple(s: &str) -> Result<(usize, usize), AppError> {
    let trimmed = s.trim();

    // Handle empty input
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
            let player = room.get_player(player_id).await?;
            let _ = room.tx.send(ServerMessage::TextMessage {
                content,
                player: player.info,
            });
        }
        ClientMessage::GameUpdate { mv, player_id } => {
            if !room.game.lock().await.state.players[0].marker
                == room.get_player(player_id).await?.info.marker
            {
                return Err(AppError::invalid_turn());
            }
            room.game.lock().await.make_move(&mv)?;

            if room.info.bot_level.is_some() {
                room.game
                    .lock()
                    .await
                    .generate_move(room.info.bot_level.unwrap());
            }
            send_board(&room.tx, room.game.clone()).await;
        }
        ClientMessage::GameRestart { action } => match action {
            RestartAction::Request => {
                let _ = room.tx.send(ServerMessage::GameRestart { action });
            }
            RestartAction::Accept => {
                room.game.lock().await.restart_game();
                let _ = room.tx.send(ServerMessage::GameRestart { action });
            }
            RestartAction::Reject => {
                let _ = room.tx.send(ServerMessage::GameRestart { action });
            }
        },
    }
    Ok(())
}

pub fn parse_message(message: Message) -> Result<ClientMessage, AppError> {
    match message {
        Message::Text(text) => serde_json::from_str(&text)
            .map_err(|e| AppError::BadRequest(format!("Invalid JSON: {}", e))),
        _ => Err(AppError::BadRequest("Unsupported message type".to_string())),
    }
}

pub async fn send_board(tx: &Sender<ServerMessage>, game: Arc<Mutex<Game>>) {
    let game = game.lock().await;
    let _ = tx.send(ServerMessage::GameUpdate {
        board: game.state.board.clone(),
        next_player: game.state.players[0].clone(),
        next_board: game
            .state
            .next_board
            .map(|b| Some(b))
            .unwrap_or_else(|| None),
    });
}
