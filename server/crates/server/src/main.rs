use anyhow::Result;
use app::start_server;
use dotenv::dotenv;
use opentelemetry::trace::TracerProvider;
use opentelemetry_sdk::trace::SdkTracerProvider;
use tracing_subscriber::{EnvFilter, layer::SubscriberExt, util::SubscriberInitExt};

mod app;
mod handlers;
mod utils;

#[tokio::main]
async fn main() -> Result<()> {
    dotenv().ok();

    let otel_provider: Option<SdkTracerProvider> = utils::otel::init_otel();
    let otel_layer = otel_provider.as_ref().map(|p| {
        let tracer = p.tracer("ultimatexo-server");
        tracing_opentelemetry::layer().with_tracer(tracer)
    });

    tracing_subscriber::registry()
        .with(EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "info".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .with(otel_layer)
        .init();

    let result = start_server().await;

    if let Some(provider) = otel_provider {
        let _ = provider.shutdown();
    }

    result
}
