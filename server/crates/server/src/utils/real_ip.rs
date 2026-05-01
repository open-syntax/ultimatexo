use axum::http::HeaderMap;
use std::net::SocketAddr;

pub fn real_client_ip_from_headers(headers: &HeaderMap) -> Option<String> {
    headers
        .get("CF-Connecting-IP")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.trim().to_string())
        .or_else(|| {
            headers
                .get("X-Real-IP")
                .and_then(|v| v.to_str().ok())
                .map(|s| s.trim().to_string())
                .filter(|s| !s.is_empty())
        })
        .or_else(|| {
            headers
                .get("X-Forwarded-For")
                .and_then(|v| v.to_str().ok())
                .and_then(|s| s.split(',').next())
                .map(|s| s.trim().to_string())
                .filter(|s| !s.is_empty())
        })
}

pub fn real_client_ip(headers: &HeaderMap, fallback: SocketAddr) -> String {
    real_client_ip_from_headers(headers).unwrap_or_else(|| fallback.ip().to_string())
}
