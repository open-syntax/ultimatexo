use anyhow::{Context, Result};
use app::RoomManager;
use axum::{Router, routing::get};
use dotenv::dotenv;
use routes::{get_rooms_handler, websocket_handler};
use std::{env, sync::Arc};
mod app;
mod game;
mod routes;
mod utils;

#[tokio::main]
async fn main() -> Result<()> {
    dotenv().ok();
    let state = Arc::new(RoomManager::new());
    let app = Router::new()
        .route("/ws/{room_id}", get(websocket_handler))
        .route("/rooms", get(get_rooms_handler))
        .with_state(state);
    let port = env::var("PORT").unwrap_or("6767".to_string());

    let listener = tokio::net::TcpListener::bind(format!("127.0.0.1:{}", port))
        .await
        .context(format!("Failed to bind Port: {}", port))?;

    println!("Server Listening on http://{}", listener.local_addr()?);
    axum::serve(listener, app).await?;
    Ok(())
}
