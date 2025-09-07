# UltimateXO 🎯

The fastest, sleekest, and most fun way to play **Ultimate Tic-Tac-Toe** online — free and open source.
Built with a Rust backend ⚡ and a modern Vite + HeroUI frontend 🎨.

**🎮 Play instantly at [UltimateXO.com](https://UltimateXO.com)**

![Gameplay Preview](client/public/board.png)

## What is Ultimate Tic-Tac-Toe?

Ultimate Tic-Tac-Toe is a strategic variant of the classic game that adds layers of complexity and excitement. Instead of a single 3×3 grid, you play on a 3×3 grid of 3×3 grids (81 squares total). The twist? Your opponent's move determines which sub-grid you must play in next, creating a dynamic game where local tactics meet global strategy.

## Features ✨

- **Modern Web Interface**: Built with Vite and styled with HeroUI for a smooth, responsive experience
- **Fast Rust Backend**: Lightning-fast game logic and state management powered by Rust
- **Real-time Gameplay**: Instant move validation and game state updates
- **Strategic Depth**: Experience the complexity of Ultimate Tic-Tac-Toe's nested gameplay
- **Mobile Friendly**: Optimized for both desktop and mobile devices
- **Open Source**: Completely free to use, modify, and contribute to

## Tech Stack 🛠️

### Frontend

- **Vite** - Fast build tool and development server
- **React Router** - A powerfull, declarative routing library
- **HeroUI** - Modern component library for beautiful interfaces
- **TypeScript** - Type-safe development

### Backend

- **Rust** - High-performance, memory-safe game engine
- **axum** - A fast, web framework for Rust

## Getting Started 🚀

### Prerequisites

- Node.js (v16 or higher)
- Rust (latest stable version)
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/project-chatty/ultimatexo.git
   cd ultimatexo
   ```

4. **Start the development server**

   ```bash
   just dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173` to start playing!

## How to Play 🎮

1. **The Big Picture**: You're playing on a 3×3 grid of smaller tic-tac-toe boards
2. **First Move**: Player X can choose any square on any sub-grid
3. **The Rule**: Your move determines which sub-grid your opponent must play in next
4. **Winning Sub-grids**: Win a sub-grid by getting three in a row (just like regular tic-tac-toe)
5. **Winning the Game**: Get three sub-grids in a row to win the ultimate game!
6. **Special Cases**: If you're sent to a completed sub-grid, you can play anywhere

## Development 🔧

### Project Structure

```
ultimatexo/
├── client/          # Vite + HeroUI frontend
│   ├── src/
│   ├── public/
│   └── package.json
├── server/           # Rust game engine
│   ├── src/
│   ├── Cargo.toml
│   └── Cargo.lock
├── docs/              # Documentation
└── README.md
```

### Contributing 🤝

Feel free to help us!

Here are some areas which need improving.

- Write tests
- Improve the client ui/ux.
- Improve the server websocket

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes**
4. **Add tests** if applicable
5. **Commit your changes** (`git commit -m 'Add some amazing feature'`)
6. **Push to the branch** (`git push origin feature/amazing-feature`)
7. **Open a Pull Request**

## Performance 🚀

- **Rust Backend**: Sub-millisecond move validation and game state updates
- **Vite Frontend**: Lightning-fast development and optimized production builds
- **Efficient Rendering**: Smooth animations and responsive interactions

## License 📜

This project is licensed under the GNU Affero General Public License v3.0 (AGPLv3).
See the [LICENSE](./LICENSE) file for details.

## Acknowledgments 🙏

- Ultimate Tic-Tac-Toe game concept and rules
- The Rust community for excellent tooling and libraries
- Vite team for the blazing-fast build tool
- HeroUI for the beautiful component library
- All contributors who help make this project better

## Support 💬

- **Issues**: Found a bug? [Report it here](https://github.com/project-chatty/ultimatexo/issues)
- **Discussions**: Have ideas or questions? [Join the discussion](https://github.com/project-chatty/ultimatexo/discussions)
- **Website**: [UltimateXO.com](https://UltimateXO.com)

---

**Ready to challenge your strategic thinking? Play UltimateXO today!** 🎯
