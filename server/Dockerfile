FROM rust:1.87.0 AS builder

WORKDIR /app
COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release && rm -rf src

COPY src ./src
RUN cargo build --release
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -r -s /bin/false appuser
WORKDIR /app

COPY --from=builder /app/target/release/server ./server
RUN chown appuser:appuser ./server

USER appuser
EXPOSE 6767
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:6767/health || exit 1

CMD ["./server"]
