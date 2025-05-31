import { Game, Player } from './Game';

export class GameManager {
  private games: Map<string, Game> = new Map();
  private playerToGame: Map<string, string> = new Map();

  createGame(gameId: string): Game {
    const game = new Game(gameId);
    this.games.set(gameId, game);
    return game;
  }

  getGame(gameId: string): Game | undefined {
    return this.games.get(gameId);
  }

  joinGame(gameId: string, player: Omit<Player, 'side' | 'isReady'>): { success: boolean; isSpectator: boolean } {
    let game = this.games.get(gameId);
    
    if (!game) {
      game = this.createGame(gameId);
    }

    const result = game.addPlayer(player);
    if (result.success) {
      this.playerToGame.set(player.id, gameId);
    }
    
    return result;
  }

  leaveGame(playerId: string): void {
    const gameId = this.playerToGame.get(playerId);
    if (gameId) {
      const game = this.games.get(gameId);
      if (game) {
        game.removePlayer(playerId);
        
        // Remove game if no players left
        if (game.getPlayerCount() === 0) {
          this.games.delete(gameId);
        }
      }
      this.playerToGame.delete(playerId);
    }
  }

  getGameByPlayerId(playerId: string): Game | undefined {
    const gameId = this.playerToGame.get(playerId);
    return gameId ? this.games.get(gameId) : undefined;
  }

  getAllGames(): Game[] {
    return Array.from(this.games.values());
  }
} 