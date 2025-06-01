import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand, 
  UpdateCommand, 
  DeleteCommand, 
  QueryCommand, 
  ScanCommand 
} from '@aws-sdk/lib-dynamodb';
import { PlayerProfile, GameResult } from '@/app/models/Player';
import { GameState } from '@/app/models/Game';

interface MatchmakingPlayer {
  playerId: string;
  socketId: string;
  playerName?: string;
  playerRank?: number;
  timestamp: string;
  ttl: number;
}

interface GameRecord extends Omit<GameState, 'board' | 'createdAt'> {
  board: string; // Serialized board state
  createdAt: string; // ISO string instead of Date
  ttl?: number; // TTL for automatic cleanup
}

export class DynamoDBService {
  private client: DynamoDBDocumentClient;
  private playersTable: string;
  private gamesTable: string;
  private matchmakingTable: string;

  constructor() {
    // Check if we're in AWS environment (deployed) or local development
    const isAWS = process.env.AWS_REGION || process.env.NODE_ENV === 'production';
    
    console.log('🗄️ DynamoDB Service - Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      AWS_REGION: process.env.AWS_REGION,
      isAWS,
      availableTables: {
        DYNAMODB_PLAYERS_TABLE: process.env.DYNAMODB_PLAYERS_TABLE,
        DYNAMODB_GAMES_TABLE: process.env.DYNAMODB_GAMES_TABLE,
        DYNAMODB_MATCHMAKING_TABLE: process.env.DYNAMODB_MATCHMAKING_TABLE
      }
    });
    
    if (isAWS) {
      // Use AWS environment credentials and table names
      const dynamoClient = new DynamoDBClient({
        region: process.env.AWS_REGION || 'us-east-1'
      });
      this.client = DynamoDBDocumentClient.from(dynamoClient);
      
      // Get table names from environment variables (set by deployment)
      this.playersTable = process.env.DYNAMODB_PLAYERS_TABLE || 'rapid-chess-online-players';
      this.gamesTable = process.env.DYNAMODB_GAMES_TABLE || 'rapid-chess-online-games';
      this.matchmakingTable = process.env.DYNAMODB_MATCHMAKING_TABLE || 'rapid-chess-online-matchmaking';
      
      console.log('☁️ DynamoDB Service - Using AWS configuration:', {
        region: process.env.AWS_REGION || 'us-east-1',
        playersTable: this.playersTable,
        gamesTable: this.gamesTable,
        matchmakingTable: this.matchmakingTable
      });
    } else {
      // For local development, use DynamoDB Local if available, otherwise throw error
      try {
        const dynamoClient = new DynamoDBClient({
          region: 'local',
          endpoint: 'http://localhost:8000', // DynamoDB Local endpoint
          credentials: {
            accessKeyId: 'local',
            secretAccessKey: 'local'
          }
        });
        this.client = DynamoDBDocumentClient.from(dynamoClient);
        
        this.playersTable = 'rapid-chess-players-local';
        this.gamesTable = 'rapid-chess-games-local';
        this.matchmakingTable = 'rapid-chess-matchmaking-local';
        
        console.log('💻 DynamoDB Service - Using local development configuration');
      } catch (error) {
        console.error('❌ DynamoDB Service - Failed to initialize:', error);
        throw new Error('DynamoDB not available in development. Please run DynamoDB Local or use in-memory storage.');
      }
    }
  }

  // Player operations
  async createPlayer(player: PlayerProfile): Promise<void> {
    await this.client.send(new PutCommand({
      TableName: this.playersTable,
      Item: {
        ...player,
        createdAt: player.createdAt.toISOString(),
        lastLoginAt: player.lastLoginAt?.toISOString()
      }
    }));
  }

  async getPlayerById(id: string): Promise<PlayerProfile | null> {
    const result = await this.client.send(new GetCommand({
      TableName: this.playersTable,
      Key: { id }
    }));

    if (!result.Item) return null;

    return {
      ...result.Item as PlayerProfile,
      createdAt: new Date(result.Item.createdAt as string),
      lastLoginAt: result.Item.lastLoginAt ? new Date(result.Item.lastLoginAt as string) : new Date()
    };
  }

  async getPlayerByUsername(username: string): Promise<PlayerProfile | null> {
    const result = await this.client.send(new QueryCommand({
      TableName: this.playersTable,
      IndexName: 'username-index',
      KeyConditionExpression: 'username = :username',
      ExpressionAttributeValues: {
        ':username': username.toLowerCase()
      }
    }));

    if (!result.Items || result.Items.length === 0) return null;

    const item = result.Items[0];
    return {
      ...item as PlayerProfile,
      createdAt: new Date(item.createdAt as string),
      lastLoginAt: item.lastLoginAt ? new Date(item.lastLoginAt as string) : new Date()
    };
  }

  async updatePlayer(player: PlayerProfile): Promise<void> {
    await this.client.send(new PutCommand({
      TableName: this.playersTable,
      Item: {
        ...player,
        createdAt: player.createdAt.toISOString(),
        lastLoginAt: player.lastLoginAt.toISOString()
      }
    }));
  }

  async getLeaderboard(limit: number = 20): Promise<PlayerProfile[]> {
    const result = await this.client.send(new ScanCommand({
      TableName: this.playersTable,
      Limit: limit,
      FilterExpression: 'gamesPlayed > :minGames',
      ExpressionAttributeValues: {
        ':minGames': 0
      }
    }));

    if (!result.Items) return [];

    return result.Items
      .map((item: any) => ({
        ...item as PlayerProfile,
        createdAt: new Date(item.createdAt as string),
        lastLoginAt: item.lastLoginAt ? new Date(item.lastLoginAt as string) : new Date()
      }))
      .sort((a: PlayerProfile, b: PlayerProfile) => b.rank - a.rank)
      .slice(0, limit);
  }

  // Game operations
  async createGame(gameState: GameState & { board: (any[] | null)[] }): Promise<void> {
    const gameRecord: GameRecord = {
      ...gameState,
      board: JSON.stringify(gameState.board),
      createdAt: gameState.createdAt.toISOString(),
      // Set TTL to 7 days from now for automatic cleanup
      ttl: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
    };

    await this.client.send(new PutCommand({
      TableName: this.gamesTable,
      Item: gameRecord
    }));
  }

  async getGame(gameId: string): Promise<(GameState & { board: (any[] | null)[] }) | null> {
    const result = await this.client.send(new GetCommand({
      TableName: this.gamesTable,
      Key: { id: gameId }
    }));

    if (!result.Item) return null;

    const gameRecord = result.Item as GameRecord;
    return {
      ...gameRecord,
      board: JSON.parse(gameRecord.board),
      createdAt: gameRecord.createdAt ? new Date(gameRecord.createdAt) : new Date()
    };
  }

  async updateGame(gameState: GameState & { board: (any[] | null)[] }): Promise<void> {
    const gameRecord: GameRecord = {
      ...gameState,
      board: JSON.stringify(gameState.board),
      createdAt: gameState.createdAt.toISOString(),
      // Extend TTL on updates
      ttl: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
    };

    await this.client.send(new PutCommand({
      TableName: this.gamesTable,
      Item: gameRecord
    }));
  }

  async deleteGame(gameId: string): Promise<void> {
    await this.client.send(new DeleteCommand({
      TableName: this.gamesTable,
      Key: { id: gameId }
    }));
  }

  async getActiveGames(): Promise<(GameState & { board: (any[] | null)[] })[]> {
    const result = await this.client.send(new QueryCommand({
      TableName: this.gamesTable,
      IndexName: 'status-createdAt-index',
      KeyConditionExpression: '#status = :status',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'playing'
      }
    }));

    if (!result.Items) return [];

    return result.Items.map(item => {
      const gameRecord = item as GameRecord;
      return {
        ...gameRecord,
        board: JSON.parse(gameRecord.board),
        createdAt: new Date(gameRecord.createdAt)
      };
    });
  }

  // Matchmaking operations
  async addToMatchmakingQueue(player: {
    playerId: string;
    socketId: string;
    playerName?: string;
    playerRank?: number;
  }): Promise<void> {
    const matchmakingPlayer: MatchmakingPlayer = {
      ...player,
      timestamp: new Date().toISOString(),
      // Set TTL to 10 minutes from now
      ttl: Math.floor(Date.now() / 1000) + (10 * 60)
    };

    await this.client.send(new PutCommand({
      TableName: this.matchmakingTable,
      Item: matchmakingPlayer
    }));
  }

  async removeFromMatchmakingQueue(playerId: string): Promise<void> {
    await this.client.send(new DeleteCommand({
      TableName: this.matchmakingTable,
      Key: { playerId }
    }));
  }

  async getMatchmakingQueue(): Promise<MatchmakingPlayer[]> {
    const result = await this.client.send(new ScanCommand({
      TableName: this.matchmakingTable
    }));

    if (!result.Items) return [];

    // Filter out expired entries (though DynamoDB TTL should handle this)
    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

    return result.Items
      .map(item => item as MatchmakingPlayer)
      .filter(player => new Date(player.timestamp) > tenMinutesAgo)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  async cleanupMatchmakingQueue(): Promise<void> {
    // DynamoDB TTL will automatically clean up expired entries
    // This method can be used for additional cleanup if needed
    const queue = await this.getMatchmakingQueue();
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const expiredPlayers = queue.filter(player => new Date(player.timestamp) < fiveMinutesAgo);

    for (const player of expiredPlayers) {
      await this.removeFromMatchmakingQueue(player.playerId);
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      // Try to scan the players table with a limit of 1
      await this.client.send(new ScanCommand({
        TableName: this.playersTable,
        Limit: 1
      }));
      return true;
    } catch (error) {
      console.error('DynamoDB health check failed:', error);
      return false;
    }
  }
} 