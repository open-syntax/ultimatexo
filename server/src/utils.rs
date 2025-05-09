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
            board: game.board(),
            status: game.status(),
            next_player: game.next_player(),
            next_board: game.next_board(),
        }
        .to_json()
        .unwrap(),
    );
}
