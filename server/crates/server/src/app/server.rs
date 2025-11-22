#[cfg(debug_assertions)]
use crate::handlers::ApiDoc;
use crate::{
    app::state::AppState,
    handlers::{create_room, get_room, get_rooms, health_check, websocket_handler},
};
use anyhow::{Context, Result};
use axum::{Router, routing::get};
#[cfg(not(debug_assertions))]
use std::time::Duration;
use std::{
    env,
    net::{SocketAddr, ToSocketAddrs},
    sync::Arc,
};
use tokio::signal;
#[cfg(not(debug_assertions))]
use tower_governor::{GovernorLayer, governor::GovernorConfigBuilder};
use tracing::info;
#[cfg(debug_assertions)]
use utoipa::OpenApi;
#[cfg(debug_assertions)]
use utoipa_swagger_ui::SwaggerUi;

#[derive(Debug, Clone)]
struct ServerConfig {
    host: String,
    port: u16,
}

impl ServerConfig {
    fn from_env() -> Result<Self> {
        let host = env::var("HOST").unwrap_or("localhost".to_string());

        let port = env::var("PORT")
            .unwrap_or("6767".to_string())
            .parse::<u16>()
            .context("PORT must be a valid u16")?;

        Ok(Self { host, port })
    }
    fn socket_addr(&self) -> Result<SocketAddr> {
        let addr_str = format!("{}:{}", self.host, self.port);
        addr_str
            .to_socket_addrs()?
            .next()
            .context("Could not resolve host to SocketAddr")
    }
    fn http_url(&self) -> String {
        format!("http://{}:{}", self.host, self.port)
    }
    fn ws_url(&self) -> String {
        format!("ws://{}:{}", self.host, self.port)
    }
}

fn build_router(state: Arc<AppState>) -> Router {
    let api_routes = Router::new()
        .route("/rooms", get(get_rooms).post(create_room))
        .route("/room/{room_id}", get(get_room))
        .route("/health", get(health_check));
    let ws_routes = Router::new().route("/{room_id}", get(websocket_handler));
    let app = Router::new().merge(api_routes).nest("/ws", ws_routes);

    #[cfg(debug_assertions)]
    let app =
        app.merge(SwaggerUi::new("/swagger-ui").url("/api-docs/openapi.json", ApiDoc::openapi()));
    app.with_state(state)
}

fn log_startup_info(config: &ServerConfig) {
    info!("Server listening on {}", config.http_url());
    info!("WebSocket available at {}", config.ws_url());
    #[cfg(debug_assertions)]
    info!("Swagger UI available at {}/swagger-ui", config.http_url());
}

pub async fn start_server() -> Result<()> {
    let config = ServerConfig::from_env()?;
    let state = Arc::new(AppState::new());
    #[allow(unused_mut)]
    let mut app = build_router(state);

    #[cfg(not(debug_assertions))]
    {
        let governor_conf = GovernorConfigBuilder::default()
            .per_second(2)
            .burst_size(5)
            .finish()
            .context("Failed to build governor config")?;

        let limiter = governor_conf.limiter().clone();

        let cleanup_secs: u64 = env::var("GOVERNOR_CLEANUP_INTERVAL_SECS")
            .unwrap_or_else(|_| "60".into())
            .parse()
            .context("GOVERNOR_CLEANUP_INTERVAL_SECS must be a valid u64")?;

        tokio::spawn(async move {
            let mut interval = tokio::time::interval(Duration::from_secs(cleanup_secs));
            loop {
                interval.tick().await;
                tracing::debug!("rate limiting storage size: {}", limiter.len());
                limiter.retain_recent();
            }
        });

        app = app.layer(GovernorLayer::new(governor_conf));
    }

    let addr = config.socket_addr()?;

    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .with_context(|| format!("Failed to bind to {}", addr))?;

    log_startup_info(&config);

    axum::serve(
        listener,
        app.into_make_service_with_connect_info::<SocketAddr>(),
    )
    .with_graceful_shutdown(shutdown_signal())
    .await
    .context("Server encountered an error during execution")?;

    info!("Server shutdown complete");
    Ok(())
}

async fn shutdown_signal() {
    let ctrl_c = async {
        signal::ctrl_c()
            .await
            .expect("Failed to install Ctrl+C handler");
    };
    #[cfg(unix)]
    let terminate = async {
        signal::unix::signal(signal::unix::SignalKind::terminate())
            .expect("Failed to install SIGTERM handler")
            .recv()
            .await;
    };
    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();
    tokio::select! {
        _ = ctrl_c => {
            info!("Received Ctrl+C signal");
        },
        _ = terminate => {
            info!("Received termination signal");
        },
    }
}
