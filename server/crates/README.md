# UltimateXO Server Architecture

The server has been refactored into a multi-crate workspace for better code organization and modularity.

## Crate Structure

### ultimatexo-core
**Location:** `crates/ultimatexo-core`

Core domain logic and data models for the game.

**Contents:**
- `models/` - Data structures (Game, Player, Room, Messages)
- `domain/` - Business logic (GameEngine, RoomRules)
- `error.rs` - Application error types

**Dependencies:** Basic Rust libraries (serde, tokio, etc.)

### ultimatexo-ai
**Location:** `crates/ultimatexo-ai`

AI algorithms for bot opponents.

**Contents:**
- `minimax.rs` - Minimax AI implementation with alpha-beta pruning

**Dependencies:** ultimatexo-core, minimax, tokio

### ultimatexo-services
**Location:** `crates/ultimatexo-services`

Service layer that orchestrates business logic.

**Contents:**
- `room_service.rs` - Room management service
- `cleanup_service.rs` - Automatic room cleanup service
- `game_ai_service.rs` - Service for applying AI moves

**Dependencies:** ultimatexo-core, ultimatexo-ai, dashmap

### ultimatexo-server
**Location:** `crates/ultimatexo-server`

HTTP/WebSocket server and API handlers.

**Contents:**
- `app/` - Server initialization and application state
- `handlers/` - HTTP and WebSocket request handlers
- `utils.rs` - Message handling utilities
- `main.rs` - Server entry point

**Dependencies:** ultimatexo-core, ultimatexo-services, axum, tower

## Building

```bash
# Build all crates
cargo build

# Build specific crate
cargo build -p ultimatexo-core

# Build the server binary
cargo build --bin server
```

## Benefits of Multi-Crate Architecture

1. **Better Separation of Concerns** - Each crate has a clear, single responsibility
2. **Improved Compile Times** - Changes to one crate don't require rebuilding everything
3. **Reusability** - Core and AI crates can be used in other projects
4. **Testability** - Each crate can be tested independently
5. **Dependency Management** - Clear dependency boundaries prevent circular dependencies
