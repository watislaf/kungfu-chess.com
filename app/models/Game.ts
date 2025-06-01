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
  enableRandomPieceGeneration: boolean; // Generate random pieces on empty rook squares
  enableHitPointsSystem: boolean; // Pieces have 3 hit points
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
  moveHistory: { from: Square, to: Square, piece: Piece, captured?: Piece, attackTarget?: Square }[];
  pieceCooldowns: PieceCooldown[];
  playerMoveHistory: PlayerMoveHistory[];
  winner?: string;
  gameEndReason?: 'checkmate' | 'stalemate' | 'draw' | 'resignation' | 'king-captured' | 'disconnection';
  // New chess features
  castlingRights: {
    whiteKingSide: boolean;
    whiteQueenSide: boolean;
    blackKingSide: boolean;
    blackQueenSide: boolean;
  };
  pendingPromotion?: {
    playerId: string;
    from: Square;
    to: Square;
  };
  check?: {
    whiteInCheck: boolean;
    blackInCheck: boolean;
    checkingPieces: { square: Square; piece: Piece }[];
  };
  lastRandomPieceGeneration?: Date;
  // Per-square piece generation cooldowns
  pieceGenerationCooldowns: { [square: string]: Date };
}

// Piece type
interface Piece {
  type: 'p' | 'r' | 'n' | 'b' | 'q' | 'k';
  color: 'w' | 'b';
  hitPoints?: number; // For hit points system (3 HP when enabled)
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
  empty[0][0] = { type: 'r', color: 'b' };
  empty[0][7] = { type: 'r', color: 'b' };
  empty[7][0] = { type: 'r', color: 'w' };
  empty[7][7] = { type: 'r', color: 'w' };
  // Place knights
  empty[0][1] = { type: 'n', color: 'b' };
  empty[0][6] = { type: 'n', color: 'b' };
  empty[7][1] = { type: 'n', color: 'w' };
  empty[7][6] = { type: 'n', color: 'w' };
  // Place bishops
  empty[0][2] = { type: 'b', color: 'b' };
  empty[0][5] = { type: 'b', color: 'b' };
  empty[7][2] = { type: 'b', color: 'w' };
  empty[7][5] = { type: 'b', color: 'w' };
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
  private lastRandomPieceGeneration: Date;
  private pieceGenerationCounter: number = 0; // Track piece generation sequence

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
        enableRandomPieceGeneration: false,
        enableHitPointsSystem: false,
      },
      moveHistory: [],
      pieceCooldowns: [],
      playerMoveHistory: [],
      castlingRights: {
        whiteKingSide: true,
        whiteQueenSide: true,
        blackKingSide: true,
        blackQueenSide: true,
      },
      pieceGenerationCooldowns: {},
    };
    this.board = createInitialBoard();
    this.lastRandomPieceGeneration = new Date();
    this.state.fen = undefined; // Not used
    // Initialize check status
    this.updateCheckStatus();
  }

  addPlayer(player: Omit<Player, 'side' | 'isReady'>, options?: { isMatchmaking?: boolean }): { success: boolean; isSpectator: boolean; message?: string } {
    try {
      // Validate input parameters
      if (!player || !player.id || !player.socketId) {
        console.error('❌ Invalid player data provided to addPlayer:', player);
        return { 
          success: false, 
          isSpectator: false, 
          message: 'Invalid player data provided' 
        };
      }

      // Only check for duplicates if this is NOT a matchmaking operation
      if (!options?.isMatchmaking) {
        // Check if player is already in the game (either as player or spectator)
        const isAlreadyPlayer = this.state.players.some(p => p.id === player.id);
        const isAlreadySpectator = this.state.spectators.some(s => s.id === player.id);
        
        if (isAlreadyPlayer || isAlreadySpectator) {
          console.log(`❌ Player ${player.name} (${player.id}) is already in game ${this.state.id}`);
          return { 
            success: false, 
            isSpectator: false, 
            message: 'You are already in this game room. You cannot join the same room twice.' 
          };
        }
      } else {
        console.log(`🎯 [Matchmaking] Allowing rejoin for player ${player.name} (${player.id}) to game ${this.state.id}`);
      }
      
      if (this.state.players.length >= 2) {
        try {
          const spectator: Spectator = {
            id: player.id,
            socketId: player.socketId,
            name: player.name,
            joinedAt: new Date(),
          };
          this.state.spectators.push(spectator);
          console.log(`✅ Player ${player.name} (${player.id}) joined as spectator in game ${this.state.id}`);
          return { success: true, isSpectator: true };
        } catch (spectatorError) {
          console.error('❌ Error adding spectator:', spectatorError);
          return { 
            success: false, 
            isSpectator: false, 
            message: 'Failed to join as spectator due to server error' 
          };
        }
      }
      
      try {
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
        
        console.log(`✅ Player ${player.name} (${player.id}) joined as ${side} player in game ${this.state.id}`);
        return { success: true, isSpectator: false };
      } catch (playerError) {
        console.error('❌ Error adding player:', playerError);
        return { 
          success: false, 
          isSpectator: false, 
          message: 'Failed to join as player due to server error' 
        };
      }
    } catch (error) {
      console.error('❌ Critical error in Game.addPlayer:', error);
      return { 
        success: false, 
        isSpectator: false, 
        message: 'A critical server error occurred while adding player' 
      };
    }
  }

  removePlayer(playerId: string): void {
    const player = this.state.players.find(p => p.id === playerId);
    const wasInActiveGame = this.state.status === 'playing' && this.state.players.length === 2;
    
    this.state.players = this.state.players.filter(p => p.id !== playerId);
    this.state.spectators = this.state.spectators.filter(s => s.id !== playerId);
    
    // If a player leaves during an active game, end the game with disconnection
    if (wasInActiveGame && player) {
      const remainingPlayer = this.state.players[0];
      if (remainingPlayer) {
        this.state.status = 'finished';
        this.state.winner = remainingPlayer.id;
        this.state.gameEndReason = 'disconnection';
        return; // Don't continue with normal waiting room logic
      }
    }
    
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
      console.log('❌ setGameSettings: Cannot set settings, game status is:', this.state.status);
      return false;
    }
    
    console.log('✅ setGameSettings: Applying settings:', {
      old: this.state.settings,
      new: settings,
      status: this.state.status
    });
    
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
      
      // Initialize hit points if system is enabled
      if (this.state.settings.enableHitPointsSystem) {
        this.initializeHitPoints();
      }
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
      lastRandomPieceGeneration: this.lastRandomPieceGeneration,
      pieceGenerationCooldowns: { ...this.state.pieceGenerationCooldowns },
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

  resetGame(): void {
    // Reset the game state to initial conditions
    this.state.status = 'waiting';
    this.state.bothPlayersReady = false;
    this.state.moveHistory = [];
    this.state.pieceCooldowns = [];
    this.state.playerMoveHistory = [];
    this.state.winner = undefined;
    this.state.gameEndReason = undefined;
    this.state.check = undefined;
    this.state.pendingPromotion = undefined;
    this.state.pieceGenerationCooldowns = {};
    
    // Reset player ready states
    this.state.players.forEach(player => {
      player.isReady = false;
    });
    
    // Reset castling rights
    this.state.castlingRights = {
      whiteKingSide: true,
      whiteQueenSide: true,
      blackKingSide: true,
      blackQueenSide: true,
    };
    
    // Reset board to initial position
    this.board = createInitialBoard();
    this.lastRandomPieceGeneration = new Date();
    
    // Reset piece generation sequence counter
    this.pieceGenerationCounter = 0;
    
    // Update check status
    this.updateCheckStatus();
  }

  surrender(playerId: string): { success: boolean; message?: string } {
    if (this.state.status !== 'playing') {
      return { success: false, message: 'Can only surrender during active gameplay' };
    }

    const player = this.state.players.find(p => p.id === playerId);
    if (!player) {
      return { success: false, message: 'Player not found' };
    }

    // Find the opponent
    const opponent = this.state.players.find(p => p.id !== playerId);
    if (!opponent) {
      return { success: false, message: 'No opponent found' };
    }

    // End the game with surrender
    this.state.status = 'finished';
    this.state.winner = opponent.id;
    this.state.gameEndReason = 'resignation';

    return { success: true };
  }

  makeMove(playerId: string, from: Square, to: Square, promotion?: string): { 
    success: boolean; 
    message?: string; 
    move?: { from: Square, to: Square, piece: Piece, captured?: Piece, attackTarget?: Square };
    needsPromotion?: boolean;
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
    if (!isLegalMove(piece, fromRow, fromCol, toRow, toCol, this.board, player.side, this.state.castlingRights, this.state.moveHistory)) {
      return { success: false, message: 'Invalid move' };
    }
    
    // Capture - check this BEFORE pawn promotion
    const captured: Piece | undefined = this.board[toRow][toCol] || undefined;
    
    // Handle en passant capture
    let enPassantCapture: Piece | undefined = undefined;
    if (piece.type === 'p' && !captured && Math.abs(toCol - fromCol) === 1) {
      // This might be an en passant capture
      const lastMove = this.state.moveHistory[this.state.moveHistory.length - 1];
      if (lastMove && lastMove.piece.type === 'p' && 
          lastMove.piece.color !== piece.color &&
          Math.abs(squareToCoords(lastMove.to)[0] - squareToCoords(lastMove.from)[0]) === 2) {
        const [lastToRow, lastToCol] = squareToCoords(lastMove.to);
        if (lastToRow === fromRow && lastToCol === toCol) {
          // En passant capture confirmed
          enPassantCapture = this.board[lastToRow][lastToCol] || undefined;
          this.board[lastToRow][lastToCol] = null; // Remove the captured pawn
          
          // Check if we emptied a rook square during en passant
          this.handleSquareEmptied(lastMove.to, now);
        }
      }
    }
    
    // Use enPassantCapture as the captured piece if it exists
    const actualCaptured = captured || enPassantCapture;
    
    // Handle hit points system
    if (this.state.settings.enableHitPointsSystem && actualCaptured) {
      // Initialize hit points if not set
      if (actualCaptured.hitPoints === undefined) {
        actualCaptured.hitPoints = 3;
      }
      
      // Reduce hit points instead of capturing immediately
      actualCaptured.hitPoints--;
      
      if (actualCaptured.hitPoints > 0) {
        // Piece still has hit points, don't capture it
        // The attacker doesn't move, only the defender loses HP
        
        // Add cooldown and move history (but no actual movement)
        this.addCooldownAndHistory(playerId, from, now, from, from, piece, undefined, to);
        
        this.cleanupOldData();
        this.checkGameEnd();
        this.updateCheckStatus();
        
        return { success: true, move: { from, to: from, piece, captured: undefined, attackTarget: to } };
      }
      // If hit points reach 0, continue with normal capture logic below
    }
    
    // If capturing a king, end the game immediately (no promotion)
    if (actualCaptured && actualCaptured.type === 'k') {
      // Move piece immediately
      this.board[toRow][toCol] = piece;
      this.board[fromRow][fromCol] = null;
      
      // Add to move history
      this.state.moveHistory.push({ from, to, piece, captured: actualCaptured, attackTarget: undefined });
      this.state.playerMoveHistory.push({ playerId, timestamp: now });
      
      // End the game
      this.state.status = 'finished';
      this.state.winner = playerId;
      this.state.gameEndReason = 'king-captured';
      
      return { success: true, move: { from, to, piece, captured: actualCaptured, attackTarget: undefined } };
    }
    
    // Check for pawn promotion (only if not capturing king)
    if (piece.type === 'p') {
      const promotionRow = piece.color === 'w' ? 0 : 7;
      if (toRow === promotionRow) {
        if (!promotion) {
          // Set pending promotion
          this.state.pendingPromotion = {
            playerId,
            from,
            to
          };
          return { success: true, needsPromotion: true };
        } else {
          // Complete promotion immediately
          const promotedPiece: Piece = {
            type: promotion as 'q' | 'r' | 'b' | 'n',
            color: piece.color,
            hitPoints: this.state.settings.enableHitPointsSystem ? 3 : undefined
          };
          piece.type = promotedPiece.type;
        }
      }
    }
    
    // Handle castling - move rook too
    if (piece.type === 'k' && Math.abs(toCol - fromCol) === 2) {
      const isKingSide = toCol > fromCol;
      const rookFromCol = isKingSide ? 7 : 0;
      const rookToCol = isKingSide ? 5 : 3;
      const rookRow = fromRow;
      
      // Move rook
      const rook = this.board[rookRow][rookFromCol];
      this.board[rookRow][rookToCol] = rook;
      this.board[rookRow][rookFromCol] = null;
      
      // Check if we emptied a rook square during castling
      const rookFromSquare = coordsToSquare(rookRow, rookFromCol);
      this.handleSquareEmptied(rookFromSquare, now);
    }
    
    // Move piece
    this.board[toRow][toCol] = piece;
    this.board[fromRow][fromCol] = null;
    
    // Check if we just emptied a rook square and start cooldown if needed
    this.handleSquareEmptied(from, now);
    
    // Update castling rights
    if (piece.type === 'k') {
      if (piece.color === 'w') {
        this.state.castlingRights.whiteKingSide = false;
        this.state.castlingRights.whiteQueenSide = false;
      } else {
        this.state.castlingRights.blackKingSide = false;
        this.state.castlingRights.blackQueenSide = false;
      }
    }
    if (piece.type === 'r') {
      if (from === 'a1') this.state.castlingRights.whiteQueenSide = false;
      if (from === 'h1') this.state.castlingRights.whiteKingSide = false;
      if (from === 'a8') this.state.castlingRights.blackQueenSide = false;
      if (from === 'h8') this.state.castlingRights.blackKingSide = false;
    }
    
    // Add cooldown and move history
    this.addCooldownAndHistory(playerId, to, now, from, to, piece, actualCaptured, undefined);
    
    // Generate random pieces if enabled
    if (this.state.settings.enableRandomPieceGeneration) {
      this.tryGenerateRandomPieces(now);
    }
    
    this.cleanupOldData();
    // Check for game end
    this.checkGameEnd();
    // Update check status after the move
    this.updateCheckStatus();
    return { success: true, move: { from, to, piece, captured: actualCaptured, attackTarget: undefined } };
  }

  private addCooldownAndHistory(playerId: string, to: Square, now: Date, from: Square, toSquare: Square, piece: Piece, captured?: Piece, attackTarget?: Square): void {
    // Remove any existing cooldowns on the destination square
    this.state.pieceCooldowns = this.state.pieceCooldowns.filter(
      pc => pc.square !== to
    );
    
    // Add cooldown on destination square
    const cooldownEnd = new Date(now.getTime() + this.state.settings!.pieceCooldownSeconds * 1000);
    this.state.pieceCooldowns.push({
      square: to,
      playerId,
      availableAt: cooldownEnd
    });
    
    // Add to player move history
    this.state.playerMoveHistory.push({ playerId, timestamp: now });
    
    // Add to game move history
    this.state.moveHistory.push({ from, to: toSquare, piece, captured, attackTarget });
    
    // Clear any pending promotion state since a move was successfully made
    this.state.pendingPromotion = undefined;
  }

  private initializeHitPoints(): void {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row][col];
        if (piece) {
          piece.hitPoints = 3;
        }
      }
    }
  }

  private tryGenerateRandomPieces(now: Date): void {
    // Check each rook square for piece generation
    const rookSquares: Square[] = ['a1', 'h1', 'a8', 'h8'];
    
    for (const square of rookSquares) {
      const [row, col] = squareToCoords(square);
      const isEmpty = this.board[row][col] === null;
      
      if (isEmpty) {
        // Check if this square has a cooldown
        const cooldownEnd = this.state.pieceGenerationCooldowns[square];
        
        if (cooldownEnd && now >= cooldownEnd) {
          // Cooldown has ended, generate a piece immediately
          this.generatePieceAtSquare(square);
          // Remove the cooldown since piece is now generated
          delete this.state.pieceGenerationCooldowns[square];
        }
        // If no cooldown exists for this empty square, it means the square 
        // was empty from the start or cooldown was already set when it became empty
      }
    }
  }

  private generatePieceAtSquare(square: Square): void {
    const [row, col] = squareToCoords(square);
    
    // Only generate if square is still empty
    if (this.board[row][col] === null) {
      // Follow specific piece order: Bishop, knight, bishop, knight, rook, queen (repeat)
      const pieceSequence: ('b' | 'n' | 'b' | 'n' | 'r' | 'q')[] = ['b', 'n', 'b', 'n', 'r', 'q'];
      const pieceType = pieceSequence[this.pieceGenerationCounter % pieceSequence.length];
      
      // Increment counter for next generation
      this.pieceGenerationCounter++;
      
      // Determine color based on square (bottom row = white, top row = black)
      const color: 'w' | 'b' = row === 7 ? 'w' : 'b';
      
      const newPiece: Piece = {
        type: pieceType,
        color,
        hitPoints: this.state.settings?.enableHitPointsSystem ? 3 : undefined
      };
      
      this.board[row][col] = newPiece;
      
      // Convert piece type to readable name
      const pieceNames = { 'b': 'bishop', 'n': 'knight', 'r': 'rook', 'q': 'queen' };
      console.log(`✨ Generated ${pieceNames[pieceType]} at ${square} (sequence #${this.pieceGenerationCounter})`);
    }
  }

  private handleSquareEmptied(square: Square, now: Date): void {
    // When a rook square becomes empty, start the 20-second cooldown
    const rookSquares: Square[] = ['a1', 'h1', 'a8', 'h8'];
    
    if (rookSquares.includes(square) && this.state.settings?.enableRandomPieceGeneration) {
      // Set cooldown to end 20 seconds from now
      const cooldownEnd = new Date(now.getTime() + 20000); // 20 seconds
      this.state.pieceGenerationCooldowns[square] = cooldownEnd;
      console.log(`⏰ Started 20s cooldown for piece generation at ${square}`);
    }
  }

  private generateRandomPiecesOnRookSquares(): void {
    // This method is no longer used - keeping for compatibility
    // The new system uses per-square cooldowns instead
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

  private updateCheckStatus(): void {
    // Find king positions
    let whiteKingSquare: Square | null = null;
    let blackKingSquare: Square | null = null;
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row][col];
        if (piece && piece.type === 'k') {
          const square = coordsToSquare(row, col);
          if (piece.color === 'w') {
            whiteKingSquare = square;
          } else {
            blackKingSquare = square;
          }
        }
      }
    }

    const checkingPieces: { square: Square; piece: Piece }[] = [];
    let whiteInCheck = false;
    let blackInCheck = false;

    // Check if white king is in check
    if (whiteKingSquare) {
      const [kingRow, kingCol] = squareToCoords(whiteKingSquare);
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = this.board[row][col];
          if (piece && piece.color === 'b') {
            if (isLegalMove(piece, row, col, kingRow, kingCol, this.board, 'black', this.state.castlingRights, this.state.moveHistory)) {
              whiteInCheck = true;
              checkingPieces.push({ square: coordsToSquare(row, col), piece });
            }
          }
        }
      }
    }

    // Check if black king is in check
    if (blackKingSquare) {
      const [kingRow, kingCol] = squareToCoords(blackKingSquare);
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = this.board[row][col];
          if (piece && piece.color === 'w') {
            if (isLegalMove(piece, row, col, kingRow, kingCol, this.board, 'white', this.state.castlingRights, this.state.moveHistory)) {
              blackInCheck = true;
              checkingPieces.push({ square: coordsToSquare(row, col), piece });
            }
          }
        }
      }
    }

    // Update check status
    this.state.check = {
      whiteInCheck,
      blackInCheck,
      checkingPieces
    };
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
            const moves = getMovesForPiece(piece, rank, file, this.board, this.state.moveHistory, this.state.castlingRights);
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

  getLastRandomPieceGeneration(): Date {
    return this.lastRandomPieceGeneration;
  }

  getPieceGenerationCooldown(square: Square): Date | null {
    return this.state.pieceGenerationCooldowns[square] || null;
  }

  getAllPieceGenerationCooldowns(): { [square: string]: Date } {
    return { ...this.state.pieceGenerationCooldowns };
  }
}

// Implement isLegalMove (minimal, no check/checkmate)
function isLegalMove(piece: Piece, fromRow: number, fromCol: number, toRow: number, toCol: number, board: (Piece | null)[][], side: 'white' | 'black', castlingRights?: any, moveHistory?: any[]): boolean {
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
      const startRow = piece.color === 'w' ? 6 : 1;
      
      // Move forward one square
      if (dc === 0 && dr === dir && !target) return true;
      
      // Move forward two squares on first move
      if (dc === 0 && dr === 2 * dir && fromRow === startRow && !target && !board[fromRow + dir][fromCol]) return true;
      
      // Capture diagonally
      if (Math.abs(dc) === 1 && dr === dir && target && target.color !== piece.color) return true;
      
      // En passant capture
      if (Math.abs(dc) === 1 && dr === dir && !target && moveHistory && moveHistory.length > 0) {
        const lastMove = moveHistory[moveHistory.length - 1];
        // Check if last move was a pawn moving two squares
        if (lastMove.piece.type === 'p' && 
            lastMove.piece.color !== piece.color &&
            Math.abs(squareToCoords(lastMove.to)[0] - squareToCoords(lastMove.from)[0]) === 2) {
          // Check if the target square is where we can capture en passant
          const [lastToRow, lastToCol] = squareToCoords(lastMove.to);
          if (lastToRow === fromRow && lastToCol === toCol) {
            return true;
          }
        }
      }
      
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
      // Normal king move
      if (Math.abs(dr) <= 1 && Math.abs(dc) <= 1) return true;
      
      // Castling
      if (dr === 0 && Math.abs(dc) === 2 && castlingRights) {
        const isWhite = piece.color === 'w';
        const baseRow = isWhite ? 7 : 0;
        const rookCol = dc > 0 ? 7 : 0; // King side or queen side
        
        // Check if castling is allowed
        if (fromRow !== baseRow || fromCol !== 4) return false;
        
        const canCastle = dc > 0 
          ? (isWhite ? castlingRights.whiteKingSide : castlingRights.blackKingSide)
          : (isWhite ? castlingRights.whiteQueenSide : castlingRights.blackQueenSide);
        
        if (!canCastle) return false;
        
        // Check if rook is in place
        const rook = board[baseRow][rookCol];
        if (!rook || rook.type !== 'r' || rook.color !== piece.color) return false;
        
        // Check if path is clear
        const startCol = Math.min(fromCol, rookCol);
        const endCol = Math.max(fromCol, rookCol);
        for (let col = startCol + 1; col < endCol; col++) {
          if (board[baseRow][col]) return false;
        }
        
        return true;
      }
      
      return false;
    }
    default:
      return false;
  }
}

// Update getMovesForPiece to allow null piece
function getMovesForPiece(piece: Piece | null, row: number, col: number, board: (Piece | null)[][], moveHistory: any[], castlingRights: any): { from: Square, to: Square }[] {
  if (!piece) return [];
  // ... implement logic to get legal moves for a given piece ...
  // For now, just return all legal moves for this piece type
  const moves: { from: Square, to: Square }[] = [];
  for (let toRow = 0; toRow < 8; toRow++) {
    for (let toCol = 0; toCol < 8; toCol++) {
      if (isLegalMove(piece, row, col, toRow, toCol, board, piece.color === 'w' ? 'white' : 'black', castlingRights, moveHistory)) {
        moves.push({ from: coordsToSquare(row, col), to: coordsToSquare(toRow, toCol) });
      }
    }
  }
  return moves;
} 