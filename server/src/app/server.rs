use anyhow::Context;
use std::{env, net::SocketAddr, sync::Arc};

use anyhow::Result;
use axum::{Router, routing::get};
use tokio::signal;

use crate::{
    app::state::AppState,
    handlers::{create_room, get_room, get_rooms, health_check, websocket_handler},
};

pub async fn start_server() -> Result<()> {
    let state = Arc::new(AppState::new());

    let app = Router::new()
        .route("/ws/{room_id}", get(websocket_handler))
        .route("/rooms", get(get_rooms).post(create_room))
        .route("/health", get(health_check))
        .route("/room/{room_id}", get(get_room))
        .with_state(state);

    let port: String = env::var("PORT").unwrap_or("6767".to_string());
    let host: String = env::var("HOST").unwrap_or("127.0.0.1".to_string());

    let listener = tokio::net::TcpListener::bind(format!("{}:{}", host, port))
        .await
        .context(format!("Failed to bind to {}:{}", host, port))?;

    tracing::info!("Server listening on {}:{}", host, port);

    axum::serve(
        listener,
        app.into_make_service_with_connect_info::<SocketAddr>(),
    )
    .with_graceful_shutdown(shutdown_signal())
    .await
    .context("Server error")?;

    Ok(())
}

async fn shutdown_signal() {
    let ctrl_c = async {
        signal::ctrl_c().await.expect("failed to handle Ctrl+C");
    };

    #[cfg(unix)]
    let terminate = async {
        signal::unix::signal(signal::unix::SignalKind::terminate())
            .expect("failed to handle the Signal")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => {},
        _ = terminate => {},
    }

    tracing::info!("signal received, starting graceful shutdown");
}
