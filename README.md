# Rapid Chess Online

A real-time multiplayer chess game built with Next.js, Socket.IO, and TypeScript using MVC architecture.

## Features

- **Unique Game Sessions**: Each game gets a unique ID for easy sharing
- **Real-time Communication**: WebSocket-based real-time updates
- **Waiting Room**: Players can share links and wait for opponents
- **Game State Management**: Proper game state tracking and player management
- **Responsive UI**: Modern, clean interface with Tailwind CSS

## Project Structure (MVC Architecture)

```
rapid-chess-online/
├── app/
│   ├── models/                 # Data models and business logic
│   │   ├── Game.ts            # Game state and player management
│   │   └── GameManager.ts     # Multiple game instance management
│   ├── controllers/           # Application logic and WebSocket handling
│   │   └── SocketController.ts # WebSocket event handling
│   ├── api/                   # API routes
│   │   └── socket/
│   │       └── route.ts       # Socket.IO server initialization
│   ├── game/                  # Game page
│   │   └── page.tsx          # Game interface and waiting room
│   ├── page.tsx              # Landing page (generates unique ID)
│   ├── layout.tsx            # App layout
│   └── globals.css           # Global styles
├── public/                    # Static assets
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
└── README.md                 # This file
```

## How It Works

1. **Landing Page**: User visits the app and gets automatically redirected to a unique game URL
2. **Game Creation**: A unique game ID is generated and the user is taken to `/game?id=<unique-id>`
3. **Waiting Room**: First player sees a shareable link and waits for a second player
4. **Game Start**: When second player joins via the link, the game automatically starts
5. **Real-time Updates**: All game state changes are synchronized via WebSocket

## Current Status

✅ **Completed:**
- MVC architecture setup
- WebSocket server with Socket.IO
- Game state management
- Player connection handling
- Unique game ID generation
- Waiting room interface
- Game start detection
- Exit functionality

🚧 **Next Steps:**
- Chess board implementation
- Chess piece movement logic
- Game rules validation
- Turn management
- Game end conditions

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   - Go to `http://localhost:3000`
   - You'll be automatically redirected to a unique game URL
   - Share the URL with a friend to start playing

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Real-time Communication**: Socket.IO
- **State Management**: React hooks + WebSocket events
- **Architecture**: MVC pattern

## WebSocket Events

### Client → Server
- `join-game`: Join a game with gameId
- `leave-game`: Leave the current game
- `disconnect`: Handle player disconnection

### Server → Client
- `game-joined`: Confirmation of joining a game
- `game-updated`: Game state updates
- `game-started`: Game has started (2 players connected)
- `player-left`: A player has left the game

## Game States

- **waiting**: Waiting for players (0-1 players)
- **playing**: Game in progress (2 players)
- **finished**: Game completed (future implementation)

## Development Notes

The project uses a separate Socket.IO server running on port 3001 alongside the Next.js development server on port 3000. This ensures proper WebSocket handling while maintaining Next.js's development features.

## Contributing

This is a foundational setup ready for chess game implementation. The next major step is implementing the chess board, piece movement, and game logic.
