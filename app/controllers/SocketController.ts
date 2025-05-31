import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { GameManager } from '../models/GameManager';
import { Player } from '../models/Game';
import { GameSettings } from '../models/Game';
import { Square } from 'chess.js';
import { v4 as uuidv4 } from 'uuid';
import { compareGameSettings } from '../utils/deepCompare';

export class SocketController {
  private io: SocketIOServer;
  private gameManager: GameManager;

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    this.gameManager = new GameManager();
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log('User connected2:', socket.id);

      socket.on('join-game', (data: { gameId: string, playerName?: string }) => {
        const { gameId, playerName } = data;
        
        const playerData = {
          id: uuidv4(),
          socketId: socket.id,
          name: playerName || `Player ${socket.id.slice(0, 6)}`
        };

        const result = this.gameManager.joinGame(gameId, playerData);
        
        if (result.success) {
          socket.join(gameId);
          
          const game = this.gameManager.getGame(gameId);
          if (game) {
            const gameState = game.getState();
            
            // Send game state to the player who just joined
            socket.emit('game-joined', {
              success: true,
              gameState,
              playerId: playerData.id,
              isSpectator: result.isSpectator
            });

            // Notify all players in the game about the update
            this.io.to(gameId).emit('game-updated', gameState);

            // If game is ready, start it
            if (game.isGameReady()) {
              this.io.to(gameId).emit('game-started', gameState);
            }
          }
        } else {
          socket.emit('game-joined', {
            success: false,
            message: 'Failed to join game'
          });
        }
      });

      socket.on('leave-game', () => {
        this.handlePlayerLeave(socket.id);
      });

      socket.on('switch-sides', () => {
        this.handleSwitchSides(socket.id);
      });

      socket.on('player-ready', () => {
        console.log('player-ready');
        this.handlePlayerReady(socket.id);
      });

      socket.on('set-game-settings', (data: { settings: GameSettings }) => {
        console.log('set-game-settings');
        this.handleSetGameSettings(socket.id, data.settings);
      });

      socket.on('make-move', (data: { from: string, to: string, promotion?: string }) => {
        this.handleMakeMove(socket.id, data.from, data.to, data.promotion);
      });

      socket.on('get-possible-moves', () => {
        this.handleGetPossibleMoves(socket.id);
      });

      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        this.handlePlayerLeave(socket.id);
      });
    });
  }

  private handlePlayerLeave(socketId: string): void {
    // Find player by socket ID and remove from game
    const games = this.gameManager.getAllGames();
    
    for (const game of games) {
      const gameState = game.getState();
      const player = gameState.players.find(p => p.socketId === socketId);
      
      if (player) {
        this.gameManager.leaveGame(player.id);
        
        // Notify remaining players
        const updatedGame = this.gameManager.getGame(gameState.id);
        if (updatedGame) {
          this.io.to(gameState.id).emit('game-updated', updatedGame.getState());
          this.io.to(gameState.id).emit('player-left', {
            playerId: player.id,
            playerName: player.name
          });
        }
        break;
      }
    }
  }

  private handleSwitchSides(socketId: string): void {
    const games = this.gameManager.getAllGames();
    
    for (const game of games) {
      const gameState = game.getState();
      const player = gameState.players.find(p => p.socketId === socketId);
      
      if (player) {
        const success = game.switchSides();
        if (success) {
          const updatedGameState = game.getState();
          this.io.to(gameState.id).emit('game-updated', updatedGameState);
          this.io.to(gameState.id).emit('sides-switched', updatedGameState);
        }
        break;
      }
    }
  }

  private handlePlayerReady(socketId: string): void {
    const games = this.gameManager.getAllGames();
    
    for (const game of games) {
      const gameState = game.getState();
      const player = gameState.players.find(p => p.socketId === socketId);
      
      if (player) {
        const success = game.setPlayerReady(player.id);
        if (success) {
          const updatedGameState = game.getState();
          this.io.to(gameState.id).emit('game-updated', updatedGameState);
          
          // If game is ready to start, emit game-started
          if (game.canStart()) {
            this.io.to(gameState.id).emit('game-started', updatedGameState);
          }
        }
        break;
      }
    }
  }

  private handleSetGameSettings(socketId: string, settings: GameSettings): void {
    const games = this.gameManager.getAllGames();
    console.log(games);
    
    for (const game of games) {
      const gameState = game.getState();
      const player = gameState.players.find(p => p.socketId === socketId);
      if (player) {
        console.log('Setting game settings:', {
          playerId: player.id,
          playerName: player.name,
          oldSettings: gameState.settings,
          newSettings: settings
        });
        
        // Only proceed if settings have actually changed
        if (compareGameSettings(gameState.settings, settings)) {
          console.log('⏭️ Settings are identical, skipping update');
          return;
        }
        
        const success = game.setGameSettings(settings);
        if (success) {
          const updatedGameState = game.getState();
          console.log('Settings updated successfully:', updatedGameState.settings);
          
          // Broadcast updated game state to all players
          this.io.to(gameState.id).emit('game-updated', updatedGameState);
          
          // Send specific settings update event to all players
          this.io.to(gameState.id).emit('settings-updated', {
            settings,
            playerId: player.id,
            playerName: player.name
          });
        } else {
          console.log('Failed to set game settings');
        }
        break;
      }
    }
  }

  private handleMakeMove(socketId: string, from: string, to: string, promotion?: string): void {
    const games = this.gameManager.getAllGames();
    
    for (const game of games) {
      const gameState = game.getState();
      const player = gameState.players.find(p => p.socketId === socketId);
      
      if (player) {
        const moveResult = game.makeMove(player.id, from as Square, to as Square, promotion);
        
        if (moveResult.success) {
          const updatedGameState = game.getState();
          this.io.to(gameState.id).emit('game-updated', updatedGameState);
          this.io.to(gameState.id).emit('move-made', {
            playerId: player.id,
            playerName: player.name,
            move: moveResult.move,
            from,
            to
          });
          
          // Check if game ended
          if (updatedGameState.status === 'finished') {
            this.io.to(gameState.id).emit('game-ended', {
              winner: updatedGameState.winner,
              reason: updatedGameState.gameEndReason
            });
          }
        } else {
          // Send error only to the player who made the invalid move
          this.io.to(socketId).emit('move-error', {
            message: moveResult.message
          });
        }
        break;
      }
    }
  }

  private handleGetPossibleMoves(socketId: string): void {
    const games = this.gameManager.getAllGames();
    for (const game of games) {
      const gameState = game.getState();
      const player = gameState.players.find(p => p.socketId === socketId);
      if (player) {
        const possibleMoves = game.getPossibleMoves(player.id);
        const pieceCooldowns = game.getAllPieceCooldowns();
        const moveCount = game.getPlayerMoveCount(player.id);
        const movesLeft = gameState.settings ? 
          Math.max(0, gameState.settings.maxMovesPerPeriod - moveCount) : 0;
        this.io.to(socketId).emit('possible-moves', {
          possibleMoves,
          pieceCooldowns,
          movesLeft
        });
        break;
      }
    }
  }

  getIO(): SocketIOServer {
    return this.io;
  }
} 