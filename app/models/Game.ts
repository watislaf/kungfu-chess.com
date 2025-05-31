import { Square } from 'chess.js'; // Only for type

export interface Player {
  id: string;
  socketId: string;
  name?: string;
  side: 'white' | 'black';
  isReady: boolean;
}

export interface Spectator {
  id: string;
  socketId: string;
  name?: string;
  joinedAt: Date;
}

export interface GameSettings {
  maxMovesPerPeriod: number; // N moves per 10 seconds
  pieceCooldownSeconds: number; // Y seconds cooldown per piece
}

export interface PieceCooldown {
  square: Square;
  playerId: string;
  availableAt: Date;
}

export interface PlayerMoveHistory {
  playerId: string;
  timestamp: Date;
}

export interface GameState {
  id: string;
  players: Player[];
  spectators: Spectator[];
  status: 'waiting' | 'settings' | 'playing' | 'finished';
  createdAt: Date;
  currentTurn?: string; // player id
  bothPlayersReady: boolean;
  settings?: GameSettings;
  // Chess-specific state
  fen?: string;
  moveHistory: { from: Square, to: Square, piece: Piece, captured?: Piece }[];
  pieceCooldowns: PieceCooldown[];
  playerMoveHistory: PlayerMoveHistory[];
  winner?: string;
  gameEndReason?: 'checkmate' | 'stalemate' | 'draw' | 'resignation' | 'king-captured';
}

// Piece type
interface Piece {
  type: 'p' | 'r' | 'n' | 'b' | 'q' | 'k';
  color: 'w' | 'b';
}

// Helper: create initial board
function createInitialBoard(): (Piece | null)[][] {
  // 8x8 array, [row][col], row 0 = rank 8, col 0 = file a
  const empty = Array(8).fill(null).map(() => Array(8).fill(null));
  // Place pawns
  for (let i = 0; i < 8; i++) {
    empty[1][i] = { type: 'p', color: 'b' };
    empty[6][i] = { type: 'p', color: 'w' };
  }
  // Place rooks
  empty[0][0] = empty[0][7] = { type: 'r', color: 'b' };
  empty[7][0] = empty[7][7] = { type: 'r', color: 'w' };
  // Place knights
  empty[0][1] = empty[0][6] = { type: 'n', color: 'b' };
  empty[7][1] = empty[7][6] = { type: 'n', color: 'w' };
  // Place bishops
  empty[0][2] = empty[0][5] = { type: 'b', color: 'b' };
  empty[7][2] = empty[7][5] = { type: 'b', color: 'w' };
  // Place queens
  empty[0][3] = { type: 'q', color: 'b' };
  empty[7][3] = { type: 'q', color: 'w' };
  // Place kings
  empty[0][4] = { type: 'k', color: 'b' };
  empty[7][4] = { type: 'k', color: 'w' };
  return empty;
}

// Helper: convert 'e4' to [row, col]
function squareToCoords(square: Square): [number, number] {
  const file = square.charCodeAt(0) - 97; // 'a' = 0
  const rank = 8 - parseInt(square[1]); // '8' = 0
  return [rank, file];
}

// Helper: convert [row, col] to 'e4'
function coordsToSquare(row: number, col: number): Square {
  return `${String.fromCharCode(97 + col)}${8 - row}` as Square;
}

export class Game {
  private state: GameState;
  private board: (Piece | null)[][];

  constructor(id: string) {
    this.state = {
      id,
      players: [],
      spectators: [],
      status: 'waiting',
      createdAt: new Date(),
      bothPlayersReady: false,
      settings: {
        maxMovesPerPeriod: 3,
        pieceCooldownSeconds: 5,
      },
      moveHistory: [],
      pieceCooldowns: [],
      playerMoveHistory: [],
    };
    this.board = createInitialBoard();
    this.state.fen = undefined; // Not used
  }

  addPlayer(player: Omit<Player, 'side' | 'isReady'>): { success: boolean; isSpectator: boolean } {
    if (this.state.players.length >= 2) {
      const spectator: Spectator = {
        id: player.id,
        socketId: player.socketId,
        name: player.name,
        joinedAt: new Date(),
      };
      this.state.spectators.push(spectator);
      return { success: true, isSpectator: true };
    }
    
    // Assign side based on player count
    const side = this.state.players.length === 0 ? 'white' : 'black';
    
    const newPlayer: Player = {
      ...player,
      side,
      isReady: false,
    };
    
    this.state.players.push(newPlayer);
    
    // Update status when both players are present - go to settings phase
    if (this.state.players.length === 2) {
      this.state.status = 'settings';
    }
    
    return { success: true, isSpectator: false };
  }

  removePlayer(playerId: string): void {
    this.state.players = this.state.players.filter(p => p.id !== playerId);
    this.state.spectators = this.state.spectators.filter(s => s.id !== playerId);
    
    if (this.state.players.length < 2) {
      this.state.status = 'waiting';
      this.state.bothPlayersReady = false;
    }
    
    // Reassign sides if needed
    if (this.state.players.length === 1) {
      this.state.players[0].side = 'white';
      this.state.players[0].isReady = false;
    }
  }

  switchSides(): boolean {
    if (this.state.players.length !== 2 || this.state.status !== 'settings') {
      return false;
    }
    
    // Switch the sides
    const [player1, player2] = this.state.players;
    player1.side = player1.side === 'white' ? 'black' : 'white';
    player2.side = player2.side === 'white' ? 'black' : 'white';
    
    // Reset ready states when sides are switched
    player1.isReady = false;
    player2.isReady = false;
    this.state.bothPlayersReady = false;
    
    return true;
  }

  setGameSettings(settings: GameSettings): boolean {
    if (this.state.status !== 'settings') {
      return false;
    }
    
    this.state.settings = settings;
    return true;
  }

  setPlayerReady(playerId: string): boolean {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player || this.state.status !== 'settings') {
      return false;
    }
    
    player.isReady = true;
    
    // Check if both players are ready
    this.state.bothPlayersReady = this.state.players.length === 2 && 
      this.state.players.every(p => p.isReady);
    
    if (this.state.bothPlayersReady && this.state.settings) {
      this.state.status = 'playing';
      this.state.fen = undefined; // Not used
      // No specific turn in this variant - both players can move
      this.state.currentTurn = undefined;
    }
    
    return true;
  }

  isSpectator(userId: string): boolean {
    return this.state.spectators.some(s => s.id === userId);
  }

  getSpectatorCount(): number {
    return this.state.spectators.length;
  }

  getState(): GameState & { board: (Piece | null)[][] } {
    return { 
      ...this.state,
      settings: this.state.settings ? { ...this.state.settings } : undefined,
      board: this.board.map(row => row.map(piece => piece ? { ...piece } : null)),
    };
  }

  getPlayerCount(): number {
    return this.state.players.length;
  }

  isGameReady(): boolean {
    return this.state.players.length === 2;
  }

  canStart(): boolean {
    return this.state.bothPlayersReady;
  }

  getPlayerBySide(side: 'white' | 'black'): Player | undefined {
    return this.state.players.find(p => p.side === side);
  }

  makeMove(playerId: string, from: Square, to: Square, promotion?: string): { 
    success: boolean; 
    message?: string; 
    move?: { from: Square, to: Square, piece: Piece, captured?: Piece };
  } {
    if (this.state.status !== 'playing' || !this.state.settings) {
      return { success: false, message: 'Game is not in playing state' };
    }
    const player = this.state.players.find(p => p.id === playerId);
    if (!player) {
      return { success: false, message: 'Player not found' };
    }
    // Check cooldown on destination square for this player
    const now = new Date();
    const pieceCooldown = this.state.pieceCooldowns.find(
      pc => pc.square === to && pc.playerId === playerId && pc.availableAt > now
    );
    if (pieceCooldown) {
      const remainingSeconds = Math.ceil((pieceCooldown.availableAt.getTime() - now.getTime()) / 1000);
      return { 
        success: false, 
        message: `Piece on cooldown for ${remainingSeconds} more seconds` 
      };
    }
    // Check move rate limit
    const tenSecondsAgo = new Date(now.getTime() - 10000);
    const recentMoves = this.state.playerMoveHistory.filter(
      pmh => pmh.playerId === playerId && pmh.timestamp > tenSecondsAgo
    );
    if (recentMoves.length >= this.state.settings.maxMovesPerPeriod) {
      return { 
        success: false, 
        message: `Move limit exceeded: ${this.state.settings.maxMovesPerPeriod} moves per 10 seconds` 
      };
    }
    // Validate move
    const [fromRow, fromCol] = squareToCoords(from);
    const [toRow, toCol] = squareToCoords(to);
    const piece = this.board[fromRow][fromCol];
    if (!piece) return { success: false, message: 'No piece at source square' };
    const pieceColor = piece.color === 'w' ? 'white' : 'black';
    if (pieceColor !== player.side) return { success: false, message: 'Cannot move opponent\'s piece' };
    // Validate move for piece type
    if (!isLegalMove(piece, fromRow, fromCol, toRow, toCol, this.board, player.side)) {
      return { success: false, message: 'Invalid move' };
    }
    // Capture
    const captured: Piece | undefined = this.board[toRow][toCol] || undefined;
    // Move piece
    this.board[toRow][toCol] = piece;
    this.board[fromRow][fromCol] = null;
    // Add cooldown on destination square
    const cooldownEnd = new Date(now.getTime() + this.state.settings.pieceCooldownSeconds * 1000);
    this.state.pieceCooldowns.push({
      square: to,
      playerId,
      availableAt: cooldownEnd
    });
    // Add to player move history
    this.state.playerMoveHistory.push({ playerId, timestamp: now });
    this.cleanupOldData();
    // Check for game end
    this.checkGameEnd();
    return { success: true, move: { from, to, piece, captured } };
  }

  private cleanupOldData(): void {
    const now = new Date();
    const tenSecondsAgo = new Date(now.getTime() - 10000);
    
    // Remove expired cooldowns
    this.state.pieceCooldowns = this.state.pieceCooldowns.filter(
      pc => pc.availableAt > now
    );
    
    // Remove old move history (keep only last 10 seconds)
    this.state.playerMoveHistory = this.state.playerMoveHistory.filter(
      pmh => pmh.timestamp > tenSecondsAgo
    );
  }

  private checkGameEnd(): void {
    let whiteKing = false;
    let blackKing = false;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece: Piece | null = this.board[row][col];
        if (piece && piece.type === 'k') {
          if (piece.color === 'w') whiteKing = true;
          if (piece.color === 'b') blackKing = true;
        }
      }
    }
    if (!whiteKing || !blackKing) {
      this.state.status = 'finished';
      if (!whiteKing) {
        this.state.winner = this.state.players.find(p => p.side === 'black')?.id;
        this.state.gameEndReason = 'king-captured';
      } else {
        this.state.winner = this.state.players.find(p => p.side === 'white')?.id;
        this.state.gameEndReason = 'king-captured';
      }
    }
  }

  getPossibleMoves(playerId: string): { [square: string]: string[] } {
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player) return {};
    const possibleMoves: { [square: string]: string[] } = {};
    const now = new Date();
    // Get all squares with player's pieces
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const square = coordsToSquare(rank, file);
        const piece: Piece | null = this.board[rank][file];
        if (piece && (piece.color === 'w' ? 'white' : 'black') === player.side) {
          // Check if piece is on cooldown
          const isOnCooldown = this.state.pieceCooldowns.some(
            (pc) => pc.square === square && pc.playerId === playerId && pc.availableAt > now
          );
          if (!isOnCooldown) {
            const moves = getMovesForPiece(piece, rank, file, this.board);
            possibleMoves[square] = moves.map((m: { to: Square }) => m.to);
          }
        }
      }
    }
    return possibleMoves;
  }

  getPlayerMoveCount(playerId: string): number {
    const tenSecondsAgo = new Date(Date.now() - 10000);
    return this.state.playerMoveHistory.filter(
      pmh => pmh.playerId === playerId && pmh.timestamp > tenSecondsAgo
    ).length;
  }

  getPieceCooldowns(playerId: string): PieceCooldown[] {
    const now = new Date();
    return this.state.pieceCooldowns.filter(
      pc => pc.playerId === playerId && pc.availableAt > now
    );
  }

  getAllPieceCooldowns(): PieceCooldown[] {
    const now = new Date();
    return this.state.pieceCooldowns.filter(pc => pc.availableAt > now);
  }
}

// Implement isLegalMove (minimal, no check/checkmate)
function isLegalMove(piece: Piece, fromRow: number, fromCol: number, toRow: number, toCol: number, board: (Piece | null)[][], side: 'white' | 'black'): boolean {
  // Only allow moves within bounds
  if (toRow < 0 || toRow > 7 || toCol < 0 || toCol > 7) return false;
  if (fromRow === toRow && fromCol === toCol) return false;
  const target = board[toRow][toCol];
  if (target && target.color === piece.color) return false;
  // Implement basic movement for each piece type
  const dr = toRow - fromRow;
  const dc = toCol - fromCol;
  switch (piece.type) {
    case 'p': {
      // Pawns move forward (direction depends on color)
      const dir = piece.color === 'w' ? -1 : 1;
      // Move forward
      if (dc === 0 && dr === dir && !target) return true;
      // Capture
      if (Math.abs(dc) === 1 && dr === dir && target && target.color !== piece.color) return true;
      return false;
    }
    case 'n': {
      if ((Math.abs(dr) === 2 && Math.abs(dc) === 1) || (Math.abs(dr) === 1 && Math.abs(dc) === 2)) return true;
      return false;
    }
    case 'b': {
      if (Math.abs(dr) !== Math.abs(dc)) return false;
      // Check path is clear
      const stepR = dr > 0 ? 1 : -1;
      const stepC = dc > 0 ? 1 : -1;
      for (let i = 1; i < Math.abs(dr); i++) {
        if (board[fromRow + i * stepR][fromCol + i * stepC]) return false;
      }
      return true;
    }
    case 'r': {
      if (dr !== 0 && dc !== 0) return false;
      const stepR = dr === 0 ? 0 : dr > 0 ? 1 : -1;
      const stepC = dc === 0 ? 0 : dc > 0 ? 1 : -1;
      const dist = Math.max(Math.abs(dr), Math.abs(dc));
      for (let i = 1; i < dist; i++) {
        if (board[fromRow + i * stepR][fromCol + i * stepC]) return false;
      }
      return true;
    }
    case 'q': {
      if (Math.abs(dr) === Math.abs(dc)) {
        // Diagonal
        const stepR = dr > 0 ? 1 : -1;
        const stepC = dc > 0 ? 1 : -1;
        for (let i = 1; i < Math.abs(dr); i++) {
          if (board[fromRow + i * stepR][fromCol + i * stepC]) return false;
        }
        return true;
      } else if (dr === 0 || dc === 0) {
        // Straight
        const stepR = dr === 0 ? 0 : dr > 0 ? 1 : -1;
        const stepC = dc === 0 ? 0 : dc > 0 ? 1 : -1;
        const dist = Math.max(Math.abs(dr), Math.abs(dc));
        for (let i = 1; i < dist; i++) {
          if (board[fromRow + i * stepR][fromCol + i * stepC]) return false;
        }
        return true;
      }
      return false;
    }
    case 'k': {
      if (Math.abs(dr) <= 1 && Math.abs(dc) <= 1) return true;
      return false;
    }
    default:
      return false;
  }
}

// Update getMovesForPiece to allow null piece
function getMovesForPiece(piece: Piece | null, row: number, col: number, board: (Piece | null)[][]): { from: Square, to: Square }[] {
  if (!piece) return [];
  // ... implement logic to get legal moves for a given piece ...
  // For now, just return all legal moves for this piece type
  const moves: { from: Square, to: Square }[] = [];
  for (let toRow = 0; toRow < 8; toRow++) {
    for (let toCol = 0; toCol < 8; toCol++) {
      if (isLegalMove(piece, row, col, toRow, toCol, board, piece.color === 'w' ? 'white' : 'black')) {
        moves.push({ from: coordsToSquare(row, col), to: coordsToSquare(toRow, toCol) });
      }
    }
  }
  return moves;
} 