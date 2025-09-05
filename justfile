set shell := ["bash", "-cu"]

client-dev:
    cd client && pnpm dev

server-dev:
    cd server && cargo run

dev:
    echo "Starting frontend and backend..."
    (cd client && pnpm dev) &
    (cd server && cargo run --release) &
    echo "Done"

build:
    echo "Building frontend and backend..."
    (cd client && pnpm build)
    (cd server && cargo build --release)
    echo "Done"
