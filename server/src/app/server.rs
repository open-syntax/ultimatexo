#[cfg(debug_assertions)]
use crate::handlers::ApiDoc;
use crate::{
    app::state::AppState,
    handlers::{
        check_server_memory, create_room, get_room, get_rooms, health_check, websocket_handler,
    },
};
use anyhow::{Context, Result};
use axum::{Router, routing::get};
use std::{env, sync::Arc};
use tokio::signal;
#[cfg(debug_assertions)]
use utoipa::OpenApi;
#[cfg(debug_assertions)]
use utoipa_swagger_ui::SwaggerUi;

pub async fn start_server() -> Result<()> {
    let state = Arc::new(AppState::new());
    let app = Router::new()
        .route("/ws/{room_id}", get(websocket_handler))
        .route("/rooms", get(get_rooms).post(create_room))
        .route("/health", get(health_check))
        .route("/mem", get(check_server_memory))
        .route("/room/{room_id}", get(get_room))
        .with_state(state);

    #[cfg(debug_assertions)]
    let app =
        app.merge(SwaggerUi::new("/swagger-ui").url("/api-docs/openapi.json", ApiDoc::openapi()));
    let port: String = env::var("PORT").unwrap_or("6767".to_string());
    let host: String = env::var("HOST").unwrap_or("127.0.0.1".to_string());

    let listener = tokio::net::TcpListener::bind(format!("{}:{}", host, port))
        .await
        .context(format!("Failed to bind to {}:{}", host, port))?;

    tracing::info!("Server listening on http://{}:{}", host, port);
    #[cfg(debug_assertions)]
    tracing::info!(
        "Swagger UI available at http://{}:{}/swagger-ui",
        host,
        port
    );

    axum::serve(listener, app.into_make_service())
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
