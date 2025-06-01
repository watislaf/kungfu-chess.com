import { PlayerProfile, LoginCredentials, RegisterData, AuthResponse, getPlayerTitle } from '@/app/models/Player';
import { GameState } from '@/app/models/Game';

// Define interfaces for database operations
export interface IDatabaseService {
  // Player operations
  createPlayer(player: PlayerProfile): Promise<void>;
  getPlayerById(id: string): Promise<PlayerProfile | null>;
  getPlayerByUsername(username: string): Promise<PlayerProfile | null>;
  updatePlayer(player: PlayerProfile): Promise<void>;
  getLeaderboard(limit?: number): Promise<PlayerProfile[]>;

  // Game operations
  createGame?(gameState: GameState & { board: (any[] | null)[] }): Promise<void>;
  getGame?(gameId: string): Promise<(GameState & { board: (any[] | null)[] }) | null>;
  updateGame?(gameState: GameState & { board: (any[] | null)[] }): Promise<void>;
  deleteGame?(gameId: string): Promise<void>;
  getActiveGames?(): Promise<(GameState & { board: (any[] | null)[] })[]>;

  // Matchmaking operations
  addToMatchmakingQueue(player: {
    playerId: string;
    socketId: string;
    playerName?: string;
    playerRank?: number;
  }): Promise<void>;
  removeFromMatchmakingQueue(playerId: string): Promise<void>;
  getMatchmakingQueue(): Promise<any[]>;
  cleanupMatchmakingQueue(): Promise<void>;

  // Health check
  healthCheck(): Promise<boolean>;
}

// In-memory database implementation (for development)
class InMemoryDatabase implements IDatabaseService {
  private players: Map<string, PlayerProfile> = new Map();
  private playersByUsername: Map<string, string> = new Map();
  private matchmakingQueue: Map<string, {
    playerId: string;
    socketId: string;
    playerName?: string;
    playerRank?: number;
    timestamp: string;
  }> = new Map();

  constructor() {
    this.createTestUsers();
  }

  private createTestUsers() {
    const testUser: PlayerProfile = {
      id: 'test-user-1',
      username: 'tugrza',
      passwordHash: 'password123',
      displayName: 'Tugrza',
      email: 'tugrza@example.com',
      createdAt: new Date(),
      lastLoginAt: new Date(),
      rank: 1400,
      gamesPlayed: 25,
      wins: 15,
      losses: 8,
      draws: 2,
      title: getPlayerTitle(1400),
      gameHistory: []
    };

    this.players.set(testUser.id, testUser);
    this.playersByUsername.set(testUser.username, testUser.id);

    const testUser2: PlayerProfile = {
      id: 'test-user-2',
      username: 'challenger',
      passwordHash: 'password123',
      displayName: 'The Challenger',
      createdAt: new Date(),
      lastLoginAt: new Date(),
      rank: 1600,
      gamesPlayed: 30,
      wins: 20,
      losses: 8,
      draws: 2,
      title: getPlayerTitle(1600),
      gameHistory: []
    };

    this.players.set(testUser2.id, testUser2);
    this.playersByUsername.set(testUser2.username, testUser2.id);
  }

  async createPlayer(player: PlayerProfile): Promise<void> {
    this.players.set(player.id, { ...player });
    this.playersByUsername.set(player.username, player.id);
  }

  async getPlayerById(id: string): Promise<PlayerProfile | null> {
    return this.players.get(id) || null;
  }

  async getPlayerByUsername(username: string): Promise<PlayerProfile | null> {
    const playerId = this.playersByUsername.get(username.toLowerCase());
    if (!playerId) return null;
    return this.players.get(playerId) || null;
  }

  async updatePlayer(player: PlayerProfile): Promise<void> {
    this.players.set(player.id, { ...player });
  }

  async getLeaderboard(limit: number = 20): Promise<PlayerProfile[]> {
    return Array.from(this.players.values())
      .filter(player => player.gamesPlayed > 0)
      .sort((a, b) => b.rank - a.rank)
      .slice(0, limit);
  }

  // Matchmaking operations (in-memory implementation)
  async addToMatchmakingQueue(player: {
    playerId: string;
    socketId: string;
    playerName?: string;
    playerRank?: number;
  }): Promise<void> {
    const queueEntry = {
      ...player,
      timestamp: new Date().toISOString()
    };
    this.matchmakingQueue.set(player.playerId, queueEntry);
    console.log(`📝 [InMemory] Added ${player.playerName || player.playerId} to matchmaking queue (size: ${this.matchmakingQueue.size})`);
  }

  async removeFromMatchmakingQueue(playerId: string): Promise<void> {
    const removed = this.matchmakingQueue.delete(playerId);
    if (removed) {
      console.log(`🗑️ [InMemory] Removed ${playerId} from matchmaking queue (size: ${this.matchmakingQueue.size})`);
    }
  }

  async getMatchmakingQueue(): Promise<any[]> {
    const queue = Array.from(this.matchmakingQueue.values());
    console.log(`📋 [InMemory] Current matchmaking queue size: ${queue.length}`);
    return queue;
  }

  async cleanupMatchmakingQueue(): Promise<void> {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    let cleanedCount = 0;
    for (const [playerId, entry] of this.matchmakingQueue.entries()) {
      if (new Date(entry.timestamp) < fiveMinutesAgo) {
        this.matchmakingQueue.delete(playerId);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 [InMemory] Cleaned up ${cleanedCount} expired entries from matchmaking queue`);
    }
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}

export class DatabaseAdapter {
  private static instance: DatabaseAdapter;
  private db: IDatabaseService;

  private constructor() {
    // Check if we're in production/AWS environment
    const useProduction = process.env.NODE_ENV === 'production' || process.env.AWS_REGION;
    
    if (useProduction) {
      try {
        // Dynamically import DynamoDB service (will be available in production)
        const { DynamoDBService } = require('./DynamoDBService');
        this.db = new DynamoDBService();
        console.log('🚀 Using DynamoDB for data storage');
      } catch (error) {
        console.warn('⚠️ DynamoDB not available, falling back to in-memory storage:', error);
        this.db = new InMemoryDatabase();
      }
    } else {
      this.db = new InMemoryDatabase();
      console.log('💻 Using in-memory storage for development');
    }
  }

  static getInstance(): DatabaseAdapter {
    if (!DatabaseAdapter.instance) {
      DatabaseAdapter.instance = new DatabaseAdapter();
    }
    return DatabaseAdapter.instance;
  }

  getDatabase(): IDatabaseService {
    return this.db;
  }

  // Proxy methods for convenience
  async createPlayer(player: PlayerProfile): Promise<void> {
    return this.db.createPlayer(player);
  }

  async getPlayerById(id: string): Promise<PlayerProfile | null> {
    return this.db.getPlayerById(id);
  }

  async getPlayerByUsername(username: string): Promise<PlayerProfile | null> {
    return this.db.getPlayerByUsername(username);
  }

  async updatePlayer(player: PlayerProfile): Promise<void> {
    return this.db.updatePlayer(player);
  }

  async getLeaderboard(limit?: number): Promise<PlayerProfile[]> {
    return this.db.getLeaderboard(limit);
  }

  async healthCheck(): Promise<boolean> {
    return this.db.healthCheck();
  }

  // Game operations (optional - only available with DynamoDB)
  async createGame(gameState: GameState & { board: (any[] | null)[] }): Promise<void> {
    if (this.db.createGame) {
      return this.db.createGame(gameState);
    }
    throw new Error('Game storage not available with current database');
  }

  async getGame(gameId: string): Promise<(GameState & { board: (any[] | null)[] }) | null> {
    if (this.db.getGame) {
      return this.db.getGame(gameId);
    }
    throw new Error('Game storage not available with current database');
  }

  async updateGame(gameState: GameState & { board: (any[] | null)[] }): Promise<void> {
    if (this.db.updateGame) {
      return this.db.updateGame(gameState);
    }
    throw new Error('Game storage not available with current database');
  }

  async deleteGame(gameId: string): Promise<void> {
    if (this.db.deleteGame) {
      return this.db.deleteGame(gameId);
    }
    throw new Error('Game storage not available with current database');
  }

  async getActiveGames(): Promise<(GameState & { board: (any[] | null)[] })[]> {
    if (this.db.getActiveGames) {
      return this.db.getActiveGames();
    }
    return [];
  }

  // Matchmaking operations
  async addToMatchmakingQueue(player: {
    playerId: string;
    socketId: string;
    playerName?: string;
    playerRank?: number;
  }): Promise<void> {
    return this.db.addToMatchmakingQueue(player);
  }

  async removeFromMatchmakingQueue(playerId: string): Promise<void> {
    return this.db.removeFromMatchmakingQueue(playerId);
  }

  async getMatchmakingQueue(): Promise<any[]> {
    return this.db.getMatchmakingQueue();
  }

  async cleanupMatchmakingQueue(): Promise<void> {
    return this.db.cleanupMatchmakingQueue();
  }
} 