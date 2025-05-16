use crate::{game::Game, routes::ServerMessage};
use anyhow::{Context, Result};
use std::sync::Arc;
use tokio::sync::{Mutex, broadcast};

pub fn parse_tuple(s: &str) -> Result<(usize, usize)> {
    let (a, b) = s
        .trim()
        .split_once(',')
        .context("Failed to split the input (expected a ',')")?;
    Ok((
        a.parse().context("Failed to parse first number")?,
        b.parse().context("Failed to parse second number")?,
    ))
}

pub async fn send_board(tx: &broadcast::Sender<String>, game: Arc<Mutex<Game>>) {
    let game = game.lock().await;
    let _ = tx.send(
        ServerMessage::GameUpdate {
            board: game.state.board.clone(),
            next_player: game.state.players[0].clone(),
            next_board: game
                .state
                .next_board
                .map(|b| Some(b.to_string()))
                .unwrap_or_else(|| None),
        }
        .to_json()
        .unwrap(),
    );
}
