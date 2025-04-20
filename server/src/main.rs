use anyhow::{Context, Result};
use axum::{Router, routing::get};
use dotenv::dotenv;
use game::Game;
use routes::websocket_handler;
use std::{
    collections::HashMap,
    env,
    sync::{Arc, Mutex},
};
use tokio::sync::broadcast;
mod game;
mod routes;
mod utils;

#[derive(Default)]
pub struct AppState {
    rooms: Mutex<HashMap<String, (broadcast::Sender<(String, String)>, Game)>>,
}

#[tokio::main]
async fn main() -> Result<()> {
    dotenv().ok();
    let state = Arc::new(AppState::default());
    let app = Router::new()
        .route("/ws/{room_id}", get(websocket_handler))
        .with_state(state);
    let port = env::var("PORT").unwrap_or("6767".to_string());

    let listener = tokio::net::TcpListener::bind(format!("127.0.0.1:{}", port))
        .await
        .context(format!("Failed to bind Port: {}", port))?;

    println!("Server Listening on http://{}", listener.local_addr()?);
    axum::serve(listener, app).await?;
    Ok(())
}
