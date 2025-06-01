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
import crypto from 'crypto';

// Session management
interface PlayerSession {
  sessionToken: string;
  playerId: string;
  createdAt: Date;
  lastActivity: Date;
  socketId?: string;
}

export class AuthService {
  private static instance: AuthService;
  private db: DatabaseAdapter;
  private activeSessions: Map<string, PlayerSession> = new Map();
  private sessionCleanupInterval: NodeJS.Timeout;

  private constructor() {
    this.db = DatabaseAdapter.getInstance();
    
    // Clean up expired sessions every 30 minutes
    this.sessionCleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions();
    }, 30 * 60 * 1000);
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(credentials: LoginCredentials, socketId?: string): Promise<AuthResponse & { sessionToken?: string }> {
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

      // Create secure session
      const sessionToken = this.createSession(player.id, socketId);

      return {
        success: true,
        player: { ...player },
        sessionToken
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Login failed. Please try again.'
      };
    }
  }

  async register(data: RegisterData, socketId?: string): Promise<AuthResponse & { sessionToken?: string }> {
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

      // Create secure session
      const sessionToken = this.createSession(player.id, socketId);

      return {
        success: true,
        player: { ...player },
        sessionToken
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

  // DEPRECATED: Use validateSessionToken instead
  // This method is kept for backward compatibility but should be phased out
  async validateSessionOld(playerId: string): Promise<{ valid: boolean; player?: PlayerProfile }> {
    console.warn('⚠️ DEPRECATED: validateSessionOld(playerId) is insecure. Use validateSessionToken() instead.');
    
    // For now, we'll just return invalid to force migration to secure tokens
    return { valid: false };
  }

  // New secure session validation method
  async validateSession(sessionToken: string, socketId?: string): Promise<{ valid: boolean; player?: PlayerProfile; playerId?: string }> {
    return this.validateSessionToken(sessionToken, socketId);
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

  // Generate a secure session token
  private generateSessionToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Create a new session for a player
  private createSession(playerId: string, socketId?: string): string {
    const sessionToken = this.generateSessionToken();
    const session: PlayerSession = {
      sessionToken,
      playerId,
      createdAt: new Date(),
      lastActivity: new Date(),
      socketId
    };
    
    // Remove any existing sessions for this player
    this.invalidatePlayerSessions(playerId);
    
    // Add new session
    this.activeSessions.set(sessionToken, session);
    
    console.log(`🔐 Created session for player ${playerId}: ${sessionToken.substring(0, 8)}...`);
    return sessionToken;
  }

  // Validate session token and return player info
  async validateSessionToken(sessionToken: string, socketId?: string): Promise<{ valid: boolean; player?: PlayerProfile; playerId?: string }> {
    try {
      const session = this.activeSessions.get(sessionToken);
      
      if (!session) {
        console.log(`❌ Invalid session token: ${sessionToken.substring(0, 8)}...`);
        return { valid: false };
      }
      
      // Check if session is expired (24 hours)
      const now = new Date();
      const sessionAge = now.getTime() - session.createdAt.getTime();
      const MAX_SESSION_AGE = 24 * 60 * 60 * 1000; // 24 hours
      
      if (sessionAge > MAX_SESSION_AGE) {
        console.log(`❌ Expired session token: ${sessionToken.substring(0, 8)}...`);
        this.activeSessions.delete(sessionToken);
        return { valid: false };
      }
      
      // Update last activity and socket ID
      session.lastActivity = now;
      if (socketId) {
        session.socketId = socketId;
      }
      
      // Get player data
      const player = await this.db.getPlayerById(session.playerId);
      if (!player) {
        console.log(`❌ Player not found for session: ${session.playerId}`);
        this.activeSessions.delete(sessionToken);
        return { valid: false };
      }
      
      console.log(`✅ Valid session for player: ${player.displayName}`);
      return { 
        valid: true, 
        player: { ...player },
        playerId: session.playerId
      };
    } catch (error) {
      console.error('Session validation error:', error);
      return { valid: false };
    }
  }

  // Clean up expired sessions
  private cleanupExpiredSessions(): void {
    const now = new Date();
    const MAX_SESSION_AGE = 24 * 60 * 60 * 1000; // 24 hours
    const expiredSessions: string[] = [];
    
    for (const [token, session] of this.activeSessions.entries()) {
      const sessionAge = now.getTime() - session.createdAt.getTime();
      if (sessionAge > MAX_SESSION_AGE) {
        expiredSessions.push(token);
      }
    }
    
    expiredSessions.forEach(token => {
      this.activeSessions.delete(token);
    });
    
    if (expiredSessions.length > 0) {
      console.log(`🧹 Cleaned up ${expiredSessions.length} expired sessions`);
    }
  }

  // Invalidate all sessions for a player
  private invalidatePlayerSessions(playerId: string): void {
    const tokensToDelete: string[] = [];
    
    for (const [token, session] of this.activeSessions.entries()) {
      if (session.playerId === playerId) {
        tokensToDelete.push(token);
      }
    }
    
    tokensToDelete.forEach(token => {
      this.activeSessions.delete(token);
    });
    
    if (tokensToDelete.length > 0) {
      console.log(`🔒 Invalidated ${tokensToDelete.length} sessions for player ${playerId}`);
    }
  }

  // Invalidate a specific session
  invalidateSession(sessionToken: string): void {
    if (this.activeSessions.delete(sessionToken)) {
      console.log(`🔒 Invalidated session: ${sessionToken.substring(0, 8)}...`);
    }
  }
} 