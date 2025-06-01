import { Game, Player } from './Game';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseAdapter } from '@/app/services/DatabaseAdapter';

interface MatchmakingPlayer {
  playerId: string;
  socketId: string;
  playerName?: string;
  playerRank?: number; // Add player rank for better matching
  timestamp: Date;
}

export class GameManager {
  private games: Map<string, Game> = new Map();
  private playerToGame: Map<string, string> = new Map();
  private db: DatabaseAdapter;

  constructor() {
    this.db = DatabaseAdapter.getInstance();
  }

  createGame(gameId: string): Game {
    const game = new Game(gameId);
    this.games.set(gameId, game);
    return game;
  }

  getGame(gameId: string): Game | undefined {
    return this.games.get(gameId);
  }

  joinGame(gameId: string, player: Omit<Player, 'side' | 'isReady'>, options?: { isMatchmaking?: boolean }): { success: boolean; isSpectator: boolean; message?: string } {
    try {
      // Validate input parameters
      if (!gameId || typeof gameId !== 'string') {
        console.error('❌ Invalid gameId provided to joinGame:', gameId);
        return { 
          success: false, 
          isSpectator: false, 
          message: 'Invalid game ID provided' 
        };
      }

      if (!player || !player.id || !player.socketId) {
        console.error('❌ Invalid player data provided to joinGame:', player);
        return { 
          success: false, 
          isSpectator: false, 
          message: 'Invalid player data provided' 
        };
      }

      let game = this.games.get(gameId);
      
      if (!game) {
        try {
          game = this.createGame(gameId);
        } catch (createError) {
          console.error('❌ Failed to create game:', createError);
          return { 
            success: false, 
            isSpectator: false, 
            message: 'Failed to create game room' 
          };
        }
      }
      
      // Only check for duplicates if this is NOT a matchmaking operation
      if (!options?.isMatchmaking) {
        // Check if player is already in this game
        try {
          const gameState = game.getState();
          const isAlreadyInGame = gameState.players.some(p => p.id === player.id) || 
                                 gameState.spectators.some(s => s.id === player.id);
          
          if (isAlreadyInGame) {
            console.log(`❌ Player ${player.name} (${player.id}) attempted to join game ${gameId} but is already in it`);
            return { 
              success: false, 
              isSpectator: false, 
              message: 'You are already in this game room. You cannot join the same room twice.' 
            };
          }

          // If game is finished and a new player is joining, reset the game
          if (gameState.status === 'finished') {
            // Check if this player was already in the finished game
            const wasInGame = gameState.players.some(p => p.id === player.id);
            if (!wasInGame) {
              // New player joining a finished game - reset it
              try {
                game.resetGame();
              } catch (resetError) {
                console.error('❌ Failed to reset game:', resetError);
                // Continue without resetting
              }
            }
          }
        } catch (stateError) {
          console.error('❌ Error checking game state:', stateError);
          // Continue with join attempt
        }
      } else {
        console.log(`🎯 [Matchmaking] Allowing rejoin for player ${player.name} (${player.id}) to game ${gameId}`);
      }

      try {
        const result = game.addPlayer(player, options);
        if (result.success) {
          this.playerToGame.set(player.id, gameId);
          console.log(`✅ Player ${player.name} (${player.id}) successfully joined game ${gameId}`);
        }
        
        return result;
      } catch (addPlayerError) {
        console.error('❌ Error adding player to game:', addPlayerError);
        return { 
          success: false, 
          isSpectator: false, 
          message: 'Failed to join game due to server error' 
        };
      }
    } catch (error) {
      console.error('❌ Critical error in GameManager.joinGame:', error);
      return { 
        success: false, 
        isSpectator: false, 
        message: 'A critical server error occurred while joining the game' 
      };
    }
  }

  leaveGame(playerId: string): void {
    const gameId = this.playerToGame.get(playerId);
    if (gameId) {
      const game = this.games.get(gameId);
      if (game) {
        const gameStateBefore = game.getState();
        game.removePlayer(playerId);
        const gameStateAfter = game.getState();
        
        console.log(`🚪 Player ${playerId} left game ${gameId}. Players before: ${gameStateBefore.players.length}, after: ${gameStateAfter.players.length}`);
        
        // Clean up game immediately if no players left, regardless of status
        if (gameStateAfter.players.length === 0) {
          console.log(`🧹 Game ${gameId} has no players left - removing game state completely`);
          this.games.delete(gameId);
          
          // Clean up any remaining player mappings for this game
          for (const [mappedPlayerId, mappedGameId] of this.playerToGame.entries()) {
            if (mappedGameId === gameId) {
              this.playerToGame.delete(mappedPlayerId);
              console.log(`🧹 Cleaned up player mapping for ${mappedPlayerId} -> ${gameId}`);
            }
          }
        }
        // Special case: If this was an active game with 2 players and now has only 1 player
        else if (gameStateBefore.status === 'playing' && 
                 gameStateBefore.players.length === 2 && 
                 gameStateAfter.players.length === 1) {
          console.log(`🎮 Game ${gameId} had active gameplay, one player left - game ended by disconnection`);
          // The Game.removePlayer method should have already handled setting winner and ending the game
        }
        // If game was in waiting/settings and now has only 1 player, reset it properly
        else if (gameStateAfter.players.length === 1 && 
                 (gameStateBefore.status === 'settings' || gameStateBefore.status === 'finished')) {
          console.log(`🔄 Game ${gameId} reset to waiting state with 1 player`);
          // The Game.removePlayer method should have already handled this
        }
      }
      this.playerToGame.delete(playerId);
    }
    
    // Also remove from matchmaking queue if present
    this.removeFromMatchmakingQueue(playerId);
  }

  getGameByPlayerId(playerId: string): Game | undefined {
    const gameId = this.playerToGame.get(playerId);
    return gameId ? this.games.get(gameId) : undefined;
  }

  getAllGames(): Game[] {
    return Array.from(this.games.values());
  }

  // Matchmaking methods using DatabaseAdapter
  async addToMatchmakingQueue(playerId: string, socketId: string, playerName?: string, playerRank?: number): Promise<void> {
    // Remove player if already in queue
    await this.removeFromMatchmakingQueue(playerId);
    
    // Add to queue via database adapter
    await this.db.addToMatchmakingQueue({
      playerId,
      socketId,
      playerName,
      playerRank
    });
    
    console.log(`🔍 Added player ${playerName || playerId} (rank: ${playerRank || 'unranked'}) to matchmaking queue`);
  }

  async removeFromMatchmakingQueue(playerId: string): Promise<void> {
    await this.db.removeFromMatchmakingQueue(playerId);
    console.log(`🚫 Removed player ${playerId} from matchmaking queue`);
  }

  async findMatch(playerId: string, playerRank?: number): Promise<{ matched: boolean; gameId?: string; opponent?: MatchmakingPlayer }> {
    // Remove the requesting player from queue if present
    await this.removeFromMatchmakingQueue(playerId);
    
    // Clean up old entries
    await this.db.cleanupMatchmakingQueue();
    
    // Get current queue
    const queue = await this.db.getMatchmakingQueue();
    console.log(`🔍 [findMatch] Queue after cleanup: ${queue.length} players`);
    
    if (queue.length === 0) {
      console.log(`🔍 No players in matchmaking queue for ${playerId}`);
      return { matched: false };
    }
    
    // Convert queue items to MatchmakingPlayer format
    const matchmakingQueue: MatchmakingPlayer[] = queue.map(item => ({
      playerId: item.playerId,
      socketId: item.socketId,
      playerName: item.playerName,
      playerRank: item.playerRank,
      timestamp: new Date(item.timestamp)
    })).filter(p => p.playerId !== playerId); // Exclude the requesting player from potential matches
    
    console.log(`🔍 [findMatch] Available players in queue (excluding self):`, matchmakingQueue.map(p => 
      `${p.playerName} (${p.playerRank || 'unranked'}) - ${p.playerId}`
    ));
    
    if (matchmakingQueue.length === 0) {
      console.log(`🔍 No other players available for matching (excluding self) for ${playerId}`);
      return { matched: false };
    }
    
    // Implement ranking-based matchmaking logic
    let bestMatch: MatchmakingPlayer | null = null;
    
    if (playerRank !== undefined) {
      // Player has a ranking - look for similar ranked players first
      const rankedPlayers = matchmakingQueue.filter(p => p.playerRank !== undefined);
      
      if (rankedPlayers.length > 0) {
        // Find the closest ranked player
        bestMatch = rankedPlayers.reduce((closest, current) => {
          const closestDiff = Math.abs((closest.playerRank || 0) - playerRank);
          const currentDiff = Math.abs((current.playerRank || 0) - playerRank);
          return currentDiff < closestDiff ? current : closest;
        });
        
        console.log(`🎯 Found ranked opponent for ${playerId} (${playerRank}) - matched with ${bestMatch.playerName} (${bestMatch.playerRank})`);
      } else {
        // No ranked players available, find an unranked player
        const unrankedPlayers = matchmakingQueue.filter(p => p.playerRank === undefined);
        if (unrankedPlayers.length > 0) {
          bestMatch = unrankedPlayers[0]; // Take the first unranked player (FIFO)
          console.log(`🎯 No ranked opponents for ${playerId} (${playerRank}) - matched with unranked player ${bestMatch.playerName}`);
        }
      }
    } else {
      // Player is unranked - look for other unranked players first
      const unrankedPlayers = matchmakingQueue.filter(p => p.playerRank === undefined);
      
      if (unrankedPlayers.length > 0) {
        bestMatch = unrankedPlayers[0]; // Take the first unranked player (FIFO)
        console.log(`🎯 Found unranked opponent for ${playerId} - matched with ${bestMatch.playerName}`);
      } else {
        // No unranked players, find any ranked player
        if (matchmakingQueue.length > 0) {
          bestMatch = matchmakingQueue[0]; // Take the first available player
          console.log(`🎯 No unranked opponents for ${playerId} - matched with ranked player ${bestMatch.playerName} (${bestMatch.playerRank})`);
        }
      }
    }
    
    if (!bestMatch) {
      console.log(`🔍 No suitable match found for ${playerId} among ${matchmakingQueue.length} players`);
      return { matched: false };
    }
    
    // Remove the matched opponent from the queue
    await this.removeFromMatchmakingQueue(bestMatch.playerId);
    console.log(`🎯 Removed matched opponent ${bestMatch.playerName} from queue`);
    
    // Create a new game for the matched players
    const newGameId = uuidv4();
    console.log(`🎯 Matched players ${playerId} and ${bestMatch.playerId} in game ${newGameId}`);
    
    return {
      matched: true,
      gameId: newGameId,
      opponent: bestMatch
    };
  }

  async getMatchmakingQueueSize(): Promise<number> {
    const queue = await this.db.getMatchmakingQueue();
    return queue.length;
  }

  async getMatchmakingQueueInfo(): Promise<{ total: number; ranked: number; unranked: number }> {
    const queue = await this.db.getMatchmakingQueue();
    const total = queue.length;
    const ranked = queue.filter(p => p.playerRank !== undefined).length;
    const unranked = total - ranked;
    
    return { total, ranked, unranked };
  }

  async cleanupMatchmakingQueue(): Promise<void> {
    await this.db.cleanupMatchmakingQueue();
    console.log(`🧹 Cleaned up matchmaking queue`);
  }

  // Enhanced method to clean up abandoned games
  cleanupAbandonedGames(): void {
    let cleanedCount = 0;
    const now = new Date();
    const abandonedTimeThreshold = 5 * 60 * 1000; // 5 minutes

    for (const [gameId, game] of this.games.entries()) {
      const gameState = game.getState();
      
      // Check if game has been abandoned
      const shouldCleanup = 
        // No players at all
        gameState.players.length === 0 ||
        // Game was playing but now has less than 2 players and has been inactive
        (gameState.status === 'playing' && 
         gameState.players.length < 2 && 
         gameState.lastActivity && 
         (now.getTime() - new Date(gameState.lastActivity).getTime()) > abandonedTimeThreshold) ||
        // Finished game with no recent activity (over 30 minutes old)
        (gameState.status === 'finished' &&
         gameState.lastActivity && 
         (now.getTime() - new Date(gameState.lastActivity).getTime()) > (30 * 60 * 1000));

      if (shouldCleanup) {
        // Clean up player mappings for this game
        for (const [playerId, mappedGameId] of this.playerToGame.entries()) {
          if (mappedGameId === gameId) {
            this.playerToGame.delete(playerId);
          }
        }
        
        // Remove the game
        this.games.delete(gameId);
        cleanedCount++;
        console.log(`🧹 Cleaned up abandoned game: ${gameId} (status: ${gameState.status}, players: ${gameState.players.length})`);
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} abandoned games`);
    }
  }
} 