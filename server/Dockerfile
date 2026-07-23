# syntax=docker/dockerfile:1.7

FROM lukemathwalker/cargo-chef:latest-rust-alpine3.24 AS chef
RUN apk add --no-cache musl-dev pkgconf openssl-dev perl
WORKDIR /app

FROM chef AS planner
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

FROM chef AS builder

RUN apk add --no-cache musl-dev pkgconf openssl-dev curl

COPY --from=planner /app/recipe.json recipe.json
RUN cargo chef cook --release --recipe-path recipe.json

COPY . .

RUN cargo build --release --bin server && \
    strip /app/target/release/server

FROM alpine:3.24 AS runtime

RUN apk add --no-cache curl ca-certificates

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY --from=builder --chown=appuser:appgroup /app/target/release/server /app/server

RUN mkdir -p /tmp && \
    chown -R appuser:appgroup /app /tmp

USER appuser

ENV HOST=0.0.0.0 \
    PORT=6767 \
    RUST_BACKTRACE=1 \
    RUST_LOG=info

EXPOSE 6767

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:6767/health || exit 1

ENTRYPOINT ["/app/server"]
