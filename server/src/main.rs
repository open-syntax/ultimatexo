use anyhow::Result;
use app::start_server;
use dotenv::dotenv;
use tracing_subscriber::{EnvFilter, layer::SubscriberExt, util::SubscriberInitExt};

mod ai;
mod app;
mod domain;
mod error;
mod handlers;
mod models;
mod services;
mod utils;

#[tokio::main]
async fn main() -> Result<()> {
    dotenv().ok();

    tracing_subscriber::registry()
        .with(EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "info".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    start_server().await?;
    Ok(())
}
