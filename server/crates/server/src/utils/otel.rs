use anyhow::anyhow;
use chrono::Local;
use opentelemetry::KeyValue;
use opentelemetry_otlp::{LogExporter, SpanExporter, WithExportConfig, WithHttpConfig};
use opentelemetry_sdk::{Resource, logs::SdkLoggerProvider, trace::SdkTracerProvider};
use sha2::Digest;
use std::{collections::HashMap, env};

pub struct Providers {
    pub tracer: SdkTracerProvider,
    pub logger: SdkLoggerProvider,
}

impl Providers {
    pub fn shutdown(&self) {
        let _ = self.tracer.force_flush();
        let _ = self.logger.force_flush();
        let _ = self.tracer.shutdown();
        let _ = self.logger.shutdown();
    }
}

pub fn init() -> anyhow::Result<Providers> {
    if env::var("AXIOM_ENABLED").unwrap_or_default() != "true" {
        return Err(anyhow!("AXIOM_ENABLED not set"));
    }

    let token = env::var("AXIOM_TOKEN").map_err(|_| anyhow!("AXIOM_TOKEN missing"))?;
    let dataset = env::var("AXIOM_DATASET").unwrap_or_else(|_| "ultimatexo".into());
    let logs_dataset = env::var("AXIOM_DATASET_LOGS").unwrap_or_else(|_| dataset.clone());
    let domain = env::var("AXIOM_DOMAIN").unwrap_or_else(|_| "api.axiom.co".into());

    let resource = Resource::builder()
        .with_attributes([
            KeyValue::new("service.name", "ultimatexo-server"),
            KeyValue::new("service.version", env!("CARGO_PKG_VERSION")),
            KeyValue::new(
                "deployment.environment",
                env::var("DEPLOYMENT_ENV").unwrap_or_else(|_| "production".into()),
            ),
        ])
        .build();

    let auth = format!("Bearer {token}");

    let trace = SpanExporter::builder()
        .with_http()
        .with_endpoint(format!("https://{domain}/v1/traces"))
        .with_protocol(opentelemetry_otlp::Protocol::HttpJson)
        .with_headers(HashMap::from([
            ("Authorization".into(), auth.clone()),
            ("X-Axiom-Dataset".into(), dataset),
        ]))
        .build()
        .map_err(|e| anyhow!("trace exporter failed: {e}"))?;

    let logs = LogExporter::builder()
        .with_http()
        .with_endpoint(format!("https://{domain}/v1/logs"))
        .with_protocol(opentelemetry_otlp::Protocol::HttpJson)
        .with_headers(HashMap::from([
            ("Authorization".into(), auth),
            ("X-Axiom-Dataset".into(), logs_dataset),
        ]))
        .build()
        .map_err(|e| anyhow!("log exporter failed: {e}"))?;

    Ok(Providers {
        tracer: SdkTracerProvider::builder()
            .with_resource(resource.clone())
            .with_batch_exporter(trace)
            .build(),
        logger: SdkLoggerProvider::builder()
            .with_resource(resource)
            .with_batch_exporter(logs)
            .build(),
    })
}

pub fn hash_ip(ip: &str) -> String {
    let salt =
        env::var("IP_HASH_SALT").unwrap_or_else(|_| Local::now().format("%Y%m%d").to_string());
    let mut h = sha2::Sha256::new();
    h.update(ip.as_bytes());
    h.update(salt.as_bytes());
    sha2::Digest::finalize(h)[..8]
        .iter()
        .map(|b| format!("{:02x}", b))
        .collect()
}
