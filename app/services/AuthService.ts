import { 
  PlayerProfile, 
  LoginCredentials, 
  RegisterData, 
  AuthResponse, 
  GameResult,
  getPlayerTitle,
  ELO_CONFIG,
  calculateEloChange
} from '@/app/models/Player';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseAdapter } from './DatabaseAdapter';

export class AuthService {
  private static instance: AuthService;
  private db: DatabaseAdapter;

  private constructor() {
    this.db = DatabaseAdapter.getInstance();
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const player = await this.db.getPlayerByUsername(credentials.username);
      
      if (!player) {
        return {
          success: false,
          message: 'Username not found'
        };
      }

      // In production: use proper password verification
      if (player.passwordHash !== credentials.password) {
        return {
          success: false,
          message: 'Invalid password'
        };
      }

      // Update last login
      player.lastLoginAt = new Date();
      await this.db.updatePlayer(player);

      return {
        success: true,
        player: { ...player }
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Login failed. Please try again.'
      };
    }
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      // Check if username already exists
      const existingPlayer = await this.db.getPlayerByUsername(data.username);
      if (existingPlayer) {
        return {
          success: false,
          message: 'Username already taken'
        };
      }

      // Validate input
      if (data.username.length < 3) {
        return {
          success: false,
          message: 'Username must be at least 3 characters'
        };
      }

      if (data.password.length < 6) {
        return {
          success: false,
          message: 'Password must be at least 6 characters'
        };
      }

      if (data.displayName.length < 2) {
        return {
          success: false,
          message: 'Display name must be at least 2 characters'
        };
      }

      const id = uuidv4();
      const now = new Date();
      
      const player: PlayerProfile = {
        id,
        username: data.username.toLowerCase(),
        passwordHash: data.password, // In production: hash properly
        displayName: data.displayName,
        email: data.email,
        createdAt: now,
        lastLoginAt: now,
        rank: ELO_CONFIG.INITIAL_RATING,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        title: getPlayerTitle(ELO_CONFIG.INITIAL_RATING),
        gameHistory: []
      };

      await this.db.createPlayer(player);

      return {
        success: true,
        player: { ...player }
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: 'Registration failed. Please try again.'
      };
    }
  }

  async getPlayerById(id: string): Promise<PlayerProfile | null> {
    return this.db.getPlayerById(id);
  }

  async validateSession(playerId: string): Promise<{ valid: boolean; player?: PlayerProfile }> {
    try {
      const player = await this.db.getPlayerById(playerId);
      
      if (!player) {
        return { valid: false };
      }

      // Update last login to current time
      player.lastLoginAt = new Date();
      await this.db.updatePlayer(player);

      return { 
        valid: true, 
        player: { ...player }
      };
    } catch (error) {
      console.error('Session validation error:', error);
      return { valid: false };
    }
  }

  async updatePlayerAfterGame(
    playerId: string, 
    opponentId: string, 
    result: 'win' | 'loss' | 'draw',
    gameId: string,
    gameEndReason: string,
    gameDuration?: number
  ): Promise<void> {
    try {
      const [player, opponent] = await Promise.all([
        this.db.getPlayerById(playerId),
        this.db.getPlayerById(opponentId)
      ]);

      if (!player || !opponent) {
        console.error('Could not find players for rank update:', { playerId, opponentId });
        return;
      }

      // Calculate Elo change
      const eloChange = calculateEloChange(player.rank, opponent.rank, result);

      // Update player stats
      const newRank = Math.max(0, player.rank + eloChange);
      player.rank = newRank;
      player.title = getPlayerTitle(newRank);
      player.gamesPlayed += 1;
      
      switch (result) {
        case 'win':
          player.wins += 1;
          break;
        case 'loss':
          player.losses += 1;
          break;
        case 'draw':
          player.draws += 1;
          break;
      }

      // Add to game history
      const gameResult: GameResult = {
        gameId,
        opponentId,
        opponentUsername: opponent.displayName,
        opponentRank: opponent.rank,
        result,
        rankChange: eloChange,
        gameEndReason,
        duration: gameDuration,
        playedAt: new Date()
      };

      player.gameHistory.unshift(gameResult);

      // Keep only last 50 games in history
      if (player.gameHistory.length > 50) {
      player.gameHistory = player.gameHistory.slice(0, 50);
      }

      await this.db.updatePlayer(player);

      console.log(`📊 Updated player ${player.displayName}: ${player.rank} (${eloChange >= 0 ? '+' : ''}${eloChange})`);
    } catch (error) {
      console.error('Error updating player after game:', error);
    }
  }

  getLeaderboard(limit: number = 20): Promise<PlayerProfile[]> {
    return this.db.getLeaderboard(limit);
  }
} 