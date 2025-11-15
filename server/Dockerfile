# syntax=docker/dockerfile:1.4

FROM lukemathwalker/cargo-chef:latest-rust-1 AS chef
WORKDIR /app

FROM chef AS planner
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

FROM chef AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

COPY --from=planner /app/recipe.json recipe.json
RUN cargo chef cook --release --recipe-path recipe.json

COPY . .

RUN cargo build --release --bin server && \
    strip /app/target/release/server

FROM debian:bookworm-slim AS runtime

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && apt-get upgrade -y \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

RUN groupadd -r appuser && \
    useradd -r -g appuser -u 1000 -d /app -s /sbin/nologin appuser

WORKDIR /app

COPY --from=builder --chown=appuser:appuser /app/target/release/server /usr/local/bin/server

RUN mkdir -p /tmp && \
    chown -R appuser:appuser /app /tmp

USER appuser

ENV HOST=0.0.0.0 \
    PORT=6767 \
    RUST_BACKTRACE=1 \
    RUST_LOG=info

EXPOSE 6767

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:6767/health || exit 1

ENTRYPOINT ["/usr/local/bin/server"]

LABEL org.opencontainers.image.title="UltimateXO Server" \
      org.opencontainers.image.description="Production server for UltimateXO" \
      org.opencontainers.image.vendor="open-syntax" \
      org.opencontainers.image.source="https://github.com/open-syntax/ultimatexo"
