# syntax=docker/dockerfile:1.4

# Use specific version for reproducibility
FROM lukemathwalker/cargo-chef:latest-rust-1 AS chef
WORKDIR /app

# Planner stage
FROM chef AS planner
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

# Builder stage
FROM chef AS builder

# hadolint ignore=DL3008
RUN apt-get update && apt-get install -y --no-install-recommends \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Build dependencies first (better caching)
COPY --from=planner /app/recipe.json recipe.json
RUN cargo chef cook --release --recipe-path recipe.json

# Copy source and build
COPY . .

# Build with optimizations
RUN cargo build --release --bin server && \
    strip /app/target/release/server

# Runtime stage
FROM debian:bookworm-slim AS runtime

# Install runtime dependencies and security updates
# hadolint ignore=DL3008,DL3015
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && apt-get upgrade -y \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create non-root user
RUN groupadd -r appuser && \
    useradd -r -g appuser -u 1000 -d /app -s /sbin/nologin appuser

WORKDIR /app

# Copy binary with correct ownership
COPY --from=builder --chown=appuser:appuser /app/target/release/server /usr/local/bin/server

# Create necessary directories
RUN mkdir -p /tmp && \
    chown -R appuser:appuser /app /tmp

# Switch to non-root user
USER appuser

# Environment variables
ENV HOST=0.0.0.0 \
    PORT=6767 \
    RUST_BACKTRACE=1 \
    RUST_LOG=info

EXPOSE 6767

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:6767/health || exit 1

# Use exec form for proper signal handling
ENTRYPOINT ["/usr/local/bin/server"]

# Metadata
LABEL org.opencontainers.image.title="UltimateXO Server" \
      org.opencontainers.image.description="Production server for UltimateXO" \
      org.opencontainers.image.vendor="open-syntax" \
      org.opencontainers.image.source="https://github.com/open-syntax/ultimatexo"
