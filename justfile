default: dev

set shell := ["bash", "-euo", "pipefail", "-c"]

client_dir := "client"
server_dir := "server"

[doc("Start client in development mode")]
client-dev:
    cd {{client_dir}} && pnpm dev

[doc("Start server in development mode")]
server-dev:
    cd {{server_dir}} && cargo run

[doc("Start server in release mode")]
server-dev-release:
    cd {{server_dir}} && cargo run --release

[doc("Start full development environment (client + server --release)")]
dev:
    #!/usr/bin/env bash
    set -euo pipefail
    echo "🚀 Starting development environment..."
    echo "📦 Client: development mode"
    echo "⚡ Server: release mode"

    just client-dev &
    CLIENT_PID=$!

    just server-dev-release &
    SERVER_PID=$!

    cleanup() {
        echo "🛑 Shutting down..."
        kill $CLIENT_PID $SERVER_PID 2>/dev/null || true
        exit 0
    }

    trap cleanup SIGINT SIGTERM

    wait

[doc("Install client dependencies")]
client-install:
    cd {{client_dir}} && pnpm install

[doc("Build client for production")]
client-build: client-install
    cd {{client_dir}} && pnpm build

[doc("Build server for production")]
server-build:
    cd {{server_dir}} && cargo build --release

[doc("Build both client and server for production")]
build: client-build server-build
    echo "✅ Build complete!"

[doc("Run client tests")]
client-test:
    cd {{client_dir}} && pnpm test

[doc("Run server tests")]
server-test:
    cd {{server_dir}} && cargo test

[doc("Run all tests")]
test: client-test server-test

# Linting and formatting
[doc("Format client code")]
client-fmt:
    cd {{client_dir}} && pnpm format

[doc("Format server code")]
server-fmt:
    cd {{server_dir}} && cargo fmt

[doc("Format all code")]
fmt: client-fmt server-fmt

[doc("Lint client code")]
client-lint:
    cd {{client_dir}} && pnpm lint

[doc("Lint server code")]
server-lint:
    cd {{server_dir}} && cargo clippy -- -D warnings

[doc("Lint all code")]
lint: client-lint server-lint

[doc("Clean client build artifacts")]
client-clean:
    cd {{client_dir}} && rm -rf dist node_modules/.cache

[doc("Clean server build artifacts")]
server-clean:
    cd {{server_dir}} && cargo clean

[doc("Clean all build artifacts")]
clean: client-clean server-clean

[doc("Show project status")]
status:
    echo "📊 Project Status:"
    echo "Client directory: {{client_dir}}"
    echo "Server directory: {{server_dir}}"
    cd {{client_dir}} && echo "Client dependencies:" && (pnpm list --depth=0 || echo "Run 'just client-install' first")
    cd {{server_dir}} && echo "Server info:" && cargo --version

[doc("Show all available recipes")]
help:
    just --list
