# UltimateXO Server Architecture Visualization

```
┌─────────────────────────────────────────────────────────────────┐
│                    UltimateXO Server Workspace                  │
│                         (Cargo Workspace)                       │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 │
        ┌────────────────────────┴────────────────────────┐
        │                                                  │
        ▼                                                  ▼
┌──────────────────────┐                      ┌──────────────────────┐
│  ultimatexo-server   │                      │   External Crates    │
│   🌐 HTTP/WebSocket  │                      │  (axum, tokio, etc)  │
│                      │                      └──────────────────────┘
│  • API Handlers      │
│  • WebSocket Handler │
│  • Server Setup      │
│  • App State         │
│  • Message Utils     │
└──────────┬───────────┘
           │ depends on
           │
           ▼
┌──────────────────────┐
│ ultimatexo-services  │
│   ⚙️  Service Layer   │
│                      │
│  • RoomService       │
│  • CleanupService    │
│  • GameAIService     │───┐
└──────────┬───────────┘   │
           │ depends on     │ depends on
           │                │
           ▼                ▼
┌──────────────────────┐   ┌──────────────────────┐
│   ultimatexo-core    │   │   ultimatexo-ai      │
│   🎮 Domain & Models │◄──│   🤖 AI Algorithms   │
│                      │   │                      │
│  • GameEngine        │   │  • MinimaxAI         │
│  • RoomRules         │   │  • Alpha-Beta Prune  │
│  • Game Models       │   └──────────────────────┘
│  • Error Types       │
└──────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                         Key Metrics                             │
├─────────────────────────────────────────────────────────────────┤
│  Total Crates:        4                                         │
│  Total Files:         31 Rust source files                      │
│  Total Lines:         ~3,432 lines of code                      │
│  Dependencies:        Clear hierarchy, no circular deps         │
│  Compilation:         Parallel, incremental                     │
└─────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                      Crate Breakdown                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📦 ultimatexo-core (Foundation)                                │
│     ├─ models/         Data structures                         │
│     │  ├─ game.rs      Game state, board, markers              │
│     │  ├─ player.rs    Player info and state                   │
│     │  ├─ room.rs      Room info and types                     │
│     │  └─ messages.rs  Client/Server messages                  │
│     ├─ domain/         Business logic                          │
│     │  ├─ game.rs      GameEngine                              │
│     │  └─ *_rules.rs   Room rule implementations              │
│     └─ error.rs        Application errors                      │
│                                                                 │
│  🤖 ultimatexo-ai (Intelligence)                                │
│     └─ minimax.rs      Minimax AI with parallel search         │
│                                                                 │
│  ⚙️  ultimatexo-services (Orchestration)                        │
│     ├─ room_service.rs      Room management                    │
│     ├─ cleanup_service.rs   Automatic cleanup                  │
│     └─ game_ai_service.rs   AI move application                │
│                                                                 │
│  🌐 ultimatexo-server (Interface)                               │
│     ├─ handlers/       API and WebSocket handlers              │
│     ├─ app/            Server initialization & state           │
│     └─ utils.rs        Message handling utilities              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                    Development Workflow                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Build all:           cargo build                               │
│  Build specific:      cargo build -p ultimatexo-core            │
│  Test all:            cargo test                                │
│  Lint all:            cargo clippy -- -D warnings               │
│  Format all:          cargo fmt                                 │
│  Run server:          cargo run --bin server                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
