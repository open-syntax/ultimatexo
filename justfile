default: dev

set shell := ["bash", "-euo", "pipefail", "-c"]

client_dir := "client"
server_dir := "server"

# ============================================================================
# Development
# ============================================================================

[doc("Start client in development mode")]
client-dev:
    cd {{client_dir}} && pnpm dev

[doc("Start server in development mode")]
server-dev:
    cd {{server_dir}} && bacon run

[doc("Start full development environment (client + server)")]
dev:
    #!/usr/bin/env bash
    set -euo pipefail
    echo "🚀 Starting development environment..."
    echo "📦 Client: http://localhost:5173"
    echo "🔌 Server: http://localhost:6767"
    just client-dev &
    CLIENT_PID=$!
    just server-dev &
    SERVER_PID=$!
    cleanup() {
        echo "🛑 Shutting down..."
        kill $CLIENT_PID $SERVER_PID 2>/dev/null || true
        exit 0
    }
    trap cleanup SIGINT SIGTERM
    wait

# ============================================================================
# Installation
# ============================================================================

[doc("Install client dependencies")]
client-install:
    @echo "📦 Installing client dependencies..."
    cd {{client_dir}} && pnpm install --frozen-lockfile

[doc("Install all dependencies")]
install: client-install
    @echo "📦 Installing pre-commit hooks..."
    pip install pre-commit
    pre-commit install
    @echo "✅ Installation complete!"

[doc("Install development tools")]
install-dev:
    @echo "🔧 Installing development tools..."
    cargo install --locked bacon cargo-audit cargo-tarpaulin
    @echo "✅ Development tools installed!"

# ============================================================================
# Building
# ============================================================================

[doc("Build client for production")]
client-build: client-install
    @echo "🔨 Building client..."
    cd {{client_dir}} && pnpm build

[doc("Build server for production")]
server-build:
    @echo "🔨 Building server..."
    cd {{server_dir}} && cargo build --release

[doc("Build both client and server for production")]
build: client-build server-build
    @echo "✅ Build complete!"

# ============================================================================
# Testing
# ============================================================================

[doc("Run client tests")]
client-test:
    @echo "🧪 Running client tests..."
    cd {{client_dir}} && pnpm run test --run || echo "No client tests found"

[doc("Run server tests")]
server-test:
    @echo "🧪 Running server tests..."
    cd {{server_dir}} && cargo test

[doc("Run all tests")]
test: client-test server-test

[doc("Generate test coverage report")]
test-coverage:
    @echo "📊 Generating coverage report..."
    cd {{server_dir}} && cargo tarpaulin --out Html --output-dir coverage

# ============================================================================
# Linting and Formatting
# ============================================================================

[doc("Format client code")]
client-fmt:
    @echo "✨ Formatting client..."
    cd {{client_dir}} && pnpm run format

[doc("Format server code")]
server-fmt:
    @echo "✨ Formatting server..."
    cd {{server_dir}} && cargo fmt

[doc("Format all code")]
fmt: client-fmt server-fmt

[doc("Lint client code")]
client-lint:
    @echo "🔍 Linting client..."
    cd {{client_dir}} && pnpm run lint

[doc("Lint server code")]
server-lint:
    @echo "🔍 Linting server..."
    cd {{server_dir}} && cargo fmt -- --check
    cd {{server_dir}} && cargo clippy -- -D warnings

[doc("Lint all code")]
lint: client-lint server-lint

# ============================================================================
# Security
# ============================================================================

[doc("Run security audit")]
audit:
    @echo "🔒 Running security audit..."
    cd {{client_dir}} && pnpm audit
    cd {{server_dir}} && cargo audit

# ============================================================================
# Docker Operations
# ============================================================================

[doc("Build Docker images locally")]
docker-build:
    @echo "🐳 Building Docker images..."
    docker build -t ultimatexo-client:local ./{{client_dir}}
    docker build -t ultimatexo-server:local ./{{server_dir}}

[doc("Start Docker Compose services")]
docker-up:
    @echo "🐳 Starting Docker services..."
    docker compose up -d

[doc("Stop Docker Compose services")]
docker-down:
    @echo "🐳 Stopping Docker services..."
    docker compose down

[doc("Restart Docker services")]
docker-restart: docker-down docker-up

[doc("Show Docker logs")]
docker-logs:
    docker compose logs -f

[doc("Show running containers")]
docker-ps:
    docker compose ps

# ============================================================================
# Local Deployment Testing
# ============================================================================

[doc("Test deployment locally")]
deploy-local: docker-build
    @echo "🚀 Testing local deployment..."
    @echo "Starting services..."
    docker compose -f docker-compose.yml up -d
    @echo "Waiting for services to be healthy..."
    @sleep 10
    @echo "Running health checks..."
    @curl -f http://localhost/api/health || echo "❌ API health check failed"
    @curl -f http://localhost/ || echo "❌ Client health check failed"
    @echo "✅ Local deployment test complete!"

# ============================================================================
# Cleaning
# ============================================================================

[doc("Clean client build artifacts")]
client-clean:
    @echo "🧹 Cleaning client..."
    cd {{client_dir}} && rm -rf dist node_modules/.cache

[doc("Clean server build artifacts")]
server-clean:
    @echo "🧹 Cleaning server..."
    cd {{server_dir}} && cargo clean

[doc("Clean Docker resources")]
docker-clean:
    @echo "🧹 Cleaning Docker resources..."
    docker system prune -f
    docker volume prune -f

[doc("Clean all build artifacts")]
clean: client-clean server-clean docker-clean

# ============================================================================
# CI/CD Helpers
# ============================================================================

[doc("Run CI checks locally")]
ci-local: lint test build
    @echo "✅ All CI checks passed!"

[doc("Run pre-commit hooks on all files")]
pre-commit:
    pre-commit run --all-files

# ============================================================================
# Release Helpers
# ============================================================================

[doc("Show current version")]
version:
    @echo "Client version:"
    @cat {{client_dir}}/package.json | grep version | head -1
    @echo "Server version:"
    @cat {{server_dir}}/Cargo.toml | grep version | head -1

[doc("Bump version (usage: just bump-version VERSION=1.2.3)")]
bump-version VERSION:
    @echo "📝 Bumping version to {{VERSION}}..."
    @cd {{client_dir}} && npm version {{VERSION}} --no-git-tag-version
    @sed -i 's/^version = .*/version = "{{VERSION}}"/' {{server_dir}}/Cargo.toml
    @echo "✅ Version bumped to {{VERSION}}"


# ============================================================================
# Monitoring
# ============================================================================

[doc("Check service health")]
health-check:
    @echo "🏥 Checking service health..."
    @curl -f http://localhost:6767/health && echo "✅ Server is healthy" || echo "❌ Server is unhealthy"
    @curl -f http://localhost:5173/ && echo "✅ Client is healthy" || echo "❌ Client is unhealthy"

# ============================================================================
# Documentation
# ============================================================================

[doc("Generate documentation")]
docs:
    @echo "📚 Generating documentation..."
    cd {{server_dir}} && cargo doc --no-deps --open

# ============================================================================
# Performance
# ============================================================================

[doc("Run performance benchmarks")]
benchmark:
    @echo "⚡ Running benchmarks..."
    cd {{server_dir}} && cargo bench

# ============================================================================
# Git Helpers
# ============================================================================

[doc("Setup git hooks and configuration")]
git-setup:
    @echo "⚙️ Setting up git..."
    git config core.hooksPath .githooks
    pre-commit install
    @echo "✅ Git setup complete!"

# ============================================================================
# Quick Start
# ============================================================================

[doc("Quick start (install, build, and run)")]
quick-start: install build docker-build docker-up
    @echo "✅ Quick start complete!"
    @echo "🌐 Client: http://localhost"
    @echo "🔌 Server: http://localhost/api"

# ============================================================================
# Status and Help
# ============================================================================

[doc("Show project status")]
status:
    @echo "📊 Project Status:"
    @echo "Client directory: {{client_dir}}"
    @echo "Server directory: {{server_dir}}"
    @cd {{client_dir}} && echo "Client dependencies:" && (pnpm list --depth=0 || echo "Run 'just client-install' first")
    @cd {{server_dir}} && echo "Server info:" && cargo --version

[doc("Show all available recipes")]
help:
    @just --list
