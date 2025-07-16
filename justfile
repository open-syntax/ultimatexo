set shell := ["bash", "-cu"]

client-dev:
    cd client && pnpm dev

server-dev:
    cd server && cargo run

dev:
    echo "Starting frontend and backend..."
    (cd client && pnpm dev) &
    (cd server && cargo run)
