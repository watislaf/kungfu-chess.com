import { GameManager } from '../models/GameManager';
import { Game, Player, GameSettings } from '../models/Game';
import { v4 as uuidv4 } from 'uuid';

/**
 * Legacy game management functions that mirror the old server.js functionality
 * but use the new TypeScript models underneath
 */
export class LegacyGameManager {
  private gameManager: GameManager;

  constructor() {
    this.gameManager = new GameManager();
  }

  /**
   * Create a new game (mirrors createGame from server.js)
   */
  createGame(gameId: string) {
    const game = this.gameManager.createGame(gameId);
    return {
      id: gameId,
      players: [],
      spectators: [],
      status: 'waiting',
      createdAt: new Date(),
      bothPlayersReady: false
    };
  }

  /**
   * Add player to game (mirrors addPlayerToGame from server.js)
   */
  addPlayerToGame(gameId: string, player: { id: string; socketId: string; name: string }) {
    const result = this.gameManager.joinGame(gameId, player);
    return result;
  }

  /**
   * Remove player from game (mirrors removePlayerFromGame from server.js)
   */
  removePlayerFromGame(playerId: string): string | undefined {
    const game = this.gameManager.getGameByPlayerId(playerId);
    if (game) {
      const gameId = game.getState().id;
      this.gameManager.leaveGame(playerId);
      return gameId;
    }
    return undefined;
  }

  /**
   * Switch game sides (mirrors switchGameSides from server.js)
   */
  switchGameSides(gameId: string): boolean {
    const game = this.gameManager.getGame(gameId);
    if (game) {
      return game.switchSides();
    }
    return false;
  }

  /**
   * Set player ready (mirrors setPlayerReady from server.js)
   */
  setPlayerReady(gameId: string, playerId: string): boolean {
    const game = this.gameManager.getGame(gameId);
    if (game) {
      return game.setPlayerReady(playerId);
    }
    return false;
  }

  /**
   * Find player by socket ID (mirrors findPlayerBySocketId from server.js)
   */
  findPlayerBySocketId(socketId: string): { player: any; game: any; isSpectator: boolean } | null {
    const games = this.gameManager.getAllGames();
    
    for (const game of games) {
      const gameState = game.getState();
      const player = gameState.players.find(p => p.socketId === socketId);
      if (player) {
        return { player, game: gameState, isSpectator: false };
      }
      const spectator = gameState.spectators.find(s => s.socketId === socketId);
      if (spectator) {
        return { player: spectator, game: gameState, isSpectator: true };
      }
    }
    return null;
  }

  /**
   * Check if user is spectator (mirrors isSpectator from server.js)
   */
  isSpectator(gameId: string, userId: string): boolean {
    const game = this.gameManager.getGame(gameId);
    if (game) {
      const gameState = game.getState();
      return gameState.spectators.some(s => s.id === userId);
    }
    return false;
  }

  /**
   * Get all games
   */
  getAllGames() {
    return this.gameManager.getAllGames().map(game => game.getState());
  }

  /**
   * Get game by ID
   */
  getGame(gameId: string) {
    const game = this.gameManager.getGame(gameId);
    return game ? game.getState() : undefined;
  }
} 