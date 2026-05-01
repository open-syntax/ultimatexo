use chrono::Local;
use opentelemetry_otlp::{WithExportConfig, WithHttpConfig};
use opentelemetry_sdk::trace::SdkTracerProvider;
use sha2::Digest;
use std::env;

pub fn init_otel() -> Option<SdkTracerProvider> {
    if env::var("AXIOM_ENABLED").unwrap_or_else(|_| "false".to_string()) != "true" {
        return None;
    }

    let token = env::var("AXIOM_TOKEN").ok()?;
    let dataset = env::var("AXIOM_DATASET").unwrap_or_else(|_| "ultimatexo".to_string());
    let domain = env::var("AXIOM_DOMAIN").unwrap_or_else(|_| "api.axiom.co".to_string());

    let endpoint = format!("https://{}/v1/traces", domain);

    let exporter = opentelemetry_otlp::SpanExporter::builder()
        .with_http()
        .with_endpoint(endpoint)
        .with_protocol(opentelemetry_otlp::Protocol::HttpBinary)
        .with_headers({
            let mut map = std::collections::HashMap::new();
            map.insert("Authorization".to_string(), format!("Bearer {}", token));
            map.insert("X-Axiom-Dataset".to_string(), dataset);
            map
        })
        .build()
        .ok()?;

    let provider = SdkTracerProvider::builder()
        .with_batch_exporter(exporter)
        .build();

    Some(provider)
}

pub fn hash_ip(ip: &str) -> String {
    // rotate based current day if no hash salt provided
    let salt =
        env::var("IP_HASH_SALT").unwrap_or_else(|_| Local::now().format("%Y%m%d").to_string());

    let mut hasher = sha2::Sha256::new();
    hasher.update(ip.as_bytes());
    hasher.update(salt.as_bytes());
    let result = hasher.finalize();

    result[..8].iter().map(|b| format!("{:02x}", b)).collect()
}
