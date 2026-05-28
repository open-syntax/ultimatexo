use anyhow::Result;
use app::start_server;
use dotenv::dotenv;
use opentelemetry::trace::TracerProvider;
use tracing_subscriber::{EnvFilter, layer::SubscriberExt, util::SubscriberInitExt};

mod app;
mod handlers;
mod utils;

#[tokio::main]
async fn main() -> Result<()> {
    dotenv().ok();

    let otel = utils::otel::init();
    if let Err(ref e) = otel {
        eprintln!("otel: {e}");
    }

    let trace = otel
        .as_ref()
        .ok()
        .map(|p| tracing_opentelemetry::layer().with_tracer(p.tracer.tracer("ultimatexo-server")));
    let logs = otel
        .as_ref()
        .ok()
        .map(|p| opentelemetry_appender_tracing::layer::OpenTelemetryTracingBridge::new(&p.logger));

    tracing_subscriber::registry()
        .with(EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "info".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .with(trace)
        .with(logs)
        .init();

    let result = start_server().await;

    if let Ok(p) = otel {
        p.shutdown();
    }

    result
}
