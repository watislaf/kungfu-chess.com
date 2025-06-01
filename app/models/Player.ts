export interface PlayerProfile {
  id: string;
  username: string;
  passwordHash: string; // In production, this would be properly hashed
  displayName: string;
  email?: string;
  createdAt: Date;
  lastLoginAt: Date;
  
  // Stats and Ranking
  rank: number; // ELO-based rating, starts at 1200
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  
  // Achievement levels based on rank
  title: PlayerTitle;
  
  // Game history
  gameHistory: GameResult[];
}

export interface GameResult {
  gameId: string;
  opponentId: string;
  opponentUsername: string;
  opponentRank: number;
  result: 'win' | 'loss' | 'draw';
  rankChange: number; // How much rank changed after this game
  gameEndReason: string;
  playedAt: Date;
  duration?: number; // Game duration in seconds
}

export type PlayerTitle = 
  | 'Novice'        // 0-999
  | 'Beginner'      // 1000-1199
  | 'Amateur'       // 1200-1399
  | 'Intermediate'  // 1400-1599
  | 'Advanced'      // 1600-1799
  | 'Expert'        // 1800-1999
  | 'Master'        // 2000-2199
  | 'Grandmaster'   // 2200+

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  password: string;
  displayName: string;
  email?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  player?: PlayerProfile;
}

// ELO Rating System Constants
export const ELO_CONFIG = {
  K_FACTOR: 32, // How much rating can change per game
  INITIAL_RATING: 1200,
  MIN_RATING: 100,
  MAX_RATING: 3000,
};

// Helper function to calculate player title based on rank
export function getPlayerTitle(rank: number): PlayerTitle {
  if (rank >= 2200) return 'Grandmaster';
  if (rank >= 2000) return 'Master';
  if (rank >= 1800) return 'Expert';
  if (rank >= 1600) return 'Advanced';
  if (rank >= 1400) return 'Intermediate';
  if (rank >= 1200) return 'Amateur';
  if (rank >= 1000) return 'Beginner';
  return 'Novice';
}

// Helper function to get title color
export function getTitleColor(title: PlayerTitle): string {
  switch (title) {
    case 'Grandmaster': return 'text-purple-600';
    case 'Master': return 'text-red-600';
    case 'Expert': return 'text-orange-600';
    case 'Advanced': return 'text-blue-600';
    case 'Intermediate': return 'text-green-600';
    case 'Amateur': return 'text-gray-600';
    case 'Beginner': return 'text-gray-500';
    case 'Novice': return 'text-gray-400';
    default: return 'text-gray-600';
  }
}

// ELO calculation function
export function calculateEloChange(
  playerRank: number, 
  opponentRank: number, 
  result: 'win' | 'loss' | 'draw'
): number {
  const expectedScore = 1 / (1 + Math.pow(10, (opponentRank - playerRank) / 400));
  
  let actualScore: number;
  switch (result) {
    case 'win': actualScore = 1; break;
    case 'loss': actualScore = 0; break;
    case 'draw': actualScore = 0.5; break;
  }
  
  const change = Math.round(ELO_CONFIG.K_FACTOR * (actualScore - expectedScore));
  return change;
} 