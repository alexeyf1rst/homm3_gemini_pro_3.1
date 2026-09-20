# 🏰 Heroes Mini — HMM3 Telegram Mini App

Turn-based strategy game inspired by **Heroes of Might and Magic 3**, designed as a **Telegram Mini App** with built-in monetization and viral mechanics.

## 🚀 Quick Start

```bash
# 1. Install dependencies
cd server
npm install

# 2. Start the server
npm start
# → Server runs at http://localhost:3000

# 3. Open in browser
# Use Chrome DevTools → Toggle Device Toolbar (Ctrl+Shift+M)
# Select any mobile device preset for the best experience
```

## 🎮 How to Play

| Action | Effect |
|--------|--------|
| **Tap a blue-highlighted hex** | Move hero along the shortest path |
| **"End Turn" button** | Reset Action Points (costs 5 Energy) |
| **Green hexes** | Grass — costs 1 AP to cross |
| **Dark green hexes** | Forest — costs 2 AP to cross |
| **Blue hexes** | Water — impassable |
| **Brown hexes** | Mountains — impassable |

## 📁 Project Structure

```
hmm3-telegram/
├── client/                       # Frontend (served as static files)
│   ├── index.html                # Entry HTML with Telegram SDK
│   ├── css/style.css             # Mobile-first styles
│   └── js/
│       ├── main.js               # App entry point
│       ├── config/constants.js   # All tunable game parameters
│       ├── hex/
│       │   ├── HexUtils.js       # Hex coordinate math
│       │   ├── HexGrid.js        # Map data model
│       │   └── HexRenderer.js    # Canvas rendering
│       ├── entities/Hero.js      # Hero entity (AP, resources)
│       ├── engine/
│       │   ├── GameEngine.js     # Main game orchestrator
│       │   ├── InputHandler.js   # Touch/mouse input
│       │   └── Pathfinder.js     # Dijkstra pathfinding
│       └── systems/
│           └── EnergySystem.js   # Energy monetization system
├── server/
│   ├── server.js                 # Express static server + API stubs
│   ├── package.json
│   └── db/schema.sql             # PostgreSQL schema
└── README.md
```

## 🛠️ Tech Stack

- **Frontend**: HTML5 Canvas, Vanilla JavaScript (ES Modules)
- **Backend**: Node.js, Express
- **Database**: PostgreSQL (schema ready, integration in Sprint 2)
- **Platform**: Telegram Mini App SDK

## 🗺️ Roadmap

- **Sprint 1** ✅ Hex grid, hero movement, AP system, energy system, DB schema
- **Sprint 2** 🔜 Map objects, combat, fog of war, Telegram auth, server state
- **Sprint 3** 🔜 Referral system, IAP store, daily quests, leaderboard

## 📝 Development

```bash
# Run with auto-restart on file changes (Node.js 18+)
cd server
npm run dev
```

## License

MIT
