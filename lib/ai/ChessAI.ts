import { Square } from 'chess.js';

export interface AIMove {
  from: Square;
  to: Square;
  score: number;
  reasoning: string;
}

export interface GameSettings {
  enableHitPointsSystem: boolean;
  enableRandomPieceGeneration: boolean;
  maxMovesPerPeriod: number;
  pieceCooldownSeconds: number;
}

interface Piece {
  type: 'p' | 'r' | 'n' | 'b' | 'q' | 'k';
  color: 'w' | 'b';
  hitPoints?: number;
}

interface PossibleMove {
  from: Square;
  to: Square;
}

export class ChessAI {
  private aiSide: 'white' | 'black';
  private difficulty: 'easy' | 'medium' | 'hard';

  constructor(aiSide: 'white' | 'black', difficulty: 'easy' | 'medium' | 'hard' = 'medium') {
    this.aiSide = aiSide;
    this.difficulty = difficulty;
  }

  // Main AI decision making function
  public getBestMove(
    board: (Piece | null)[][],
    possibleMoves: { [square: string]: string[] },
    settings: GameSettings,
    pieceCooldowns: any[] = [],
    gameState?: any
  ): AIMove | null {
    const allMoves = this.getAllValidMoves(possibleMoves);
    
    if (allMoves.length === 0) {
      return null;
    }

    // Evaluate each possible move
    const evaluatedMoves: AIMove[] = allMoves.map(move => {
      const score = this.evaluateMove(move, board, settings, gameState);
      const reasoning = this.getReasoningForMove(move, board, settings, score);
      
      return {
        ...move,
        score,
        reasoning
      };
    });

    // Sort moves by score (descending)
    evaluatedMoves.sort((a, b) => b.score - a.score);

    // Add some randomness based on difficulty
    const topMoves = this.selectFromTopMoves(evaluatedMoves);
    
    return topMoves[0] || null;
  }

  private getAllValidMoves(possibleMoves: { [square: string]: string[] }): PossibleMove[] {
    const moves: PossibleMove[] = [];
    
    for (const [from, toSquares] of Object.entries(possibleMoves)) {
      for (const to of toSquares) {
        moves.push({ from: from as Square, to: to as Square });
      }
    }
    
    return moves;
  }

  private evaluateMove(
    move: PossibleMove,
    board: (Piece | null)[][],
    settings: GameSettings,
    gameState?: any
  ): number {
    let score = 0;
    
    const [fromRow, fromCol] = this.squareToCoords(move.from);
    const [toRow, toCol] = this.squareToCoords(move.to);
    
    const movingPiece = board[fromRow][fromCol];
    const targetPiece = board[toRow][toCol];
    
    if (!movingPiece) return -1000; // Invalid move
    
    // Base piece position value
    score += this.getPositionValue(movingPiece, toRow, toCol);
    
    // Capture evaluation
    if (targetPiece && targetPiece.color !== movingPiece.color) {
      score += this.evaluateCapture(targetPiece, settings);
    }
    
    // Special game mode considerations
    score += this.evaluateSpecialRules(move, board, settings, movingPiece, targetPiece);
    
    // King safety
    score += this.evaluateKingSafety(move, board, movingPiece);
    
    // Center control
    score += this.evaluateCenterControl(move, movingPiece);
    
    // Development (early game)
    score += this.evaluateDevelopment(move, board, movingPiece);
    
    return score;
  }

  private evaluateCapture(targetPiece: Piece, settings: GameSettings): number {
    let captureValue = this.getPieceValue(targetPiece.type);
    
    // Hit points system consideration
    if (settings.enableHitPointsSystem) {
      const hitPoints = targetPiece.hitPoints || 3;
      if (hitPoints > 1) {
        // Prioritize attacking pieces with hit points to weaken them
        captureValue *= 1.5;
      } else {
        // High value for finishing off low-HP pieces
        captureValue *= 2.0;
      }
    }
    
    return captureValue;
  }

  private evaluateSpecialRules(
    move: PossibleMove,
    board: (Piece | null)[][],
    settings: GameSettings,
    movingPiece: Piece,
    targetPiece: Piece | null
  ): number {
    let score = 0;
    
    // Random piece generation: prioritize clearing spawn squares
    if (settings.enableRandomPieceGeneration) {
      const spawnSquares = ['a1', 'h1', 'a8', 'h8'];
      
      // High bonus for capturing pieces on spawn squares
      if (spawnSquares.includes(move.to) && targetPiece) {
        score += 150; // Significant bonus
      }
      
      // Bonus for controlling spawn squares
      if (spawnSquares.includes(move.to)) {
        score += 50;
      }
      
      // Penalty for moving pieces away from defending spawn squares
      if (spawnSquares.includes(move.from)) {
        const opponentColor = this.aiSide === 'white' ? 'b' : 'w';
        if (this.isSquareUnderAttack(move.from, board, opponentColor)) {
          score -= 30; // Don't leave spawn squares undefended
        }
      }
    }
    
    // Hit points system: prioritize systematic attacks
    if (settings.enableHitPointsSystem && targetPiece) {
      const hitPoints = targetPiece.hitPoints || 3;
      
      // Bonus for attacking pieces that are already damaged
      if (hitPoints < 3) {
        score += (3 - hitPoints) * 25;
      }
      
      // Extra bonus for high-value damaged pieces
      if (hitPoints === 1 && this.getPieceValue(targetPiece.type) > 300) {
        score += 100;
      }
    }
    
    return score;
  }

  private evaluateKingSafety(move: PossibleMove, board: (Piece | null)[][], movingPiece: Piece): number {
    let score = 0;
    
    // Find our king
    const kingPos = this.findKing(board, this.aiSide === 'white' ? 'w' : 'b');
    if (!kingPos) return 0;
    
    // High penalty for exposing king
    if (movingPiece.type === 'k') {
      const [toRow, toCol] = this.squareToCoords(move.to);
      const opponentColor = this.aiSide === 'white' ? 'b' : 'w';
      
      if (this.isSquareUnderAttack(move.to, board, opponentColor)) {
        score -= 200; // Don't move king into danger
      }
      
      // Prefer castling when possible
      if (Math.abs(toCol - this.squareToCoords(move.from)[1]) === 2) {
        score += 80; // Castling bonus
      }
    }
    
    // Bonus for defending the king
    const [kingRow, kingCol] = this.squareToCoords(kingPos);
    const [toRow, toCol] = this.squareToCoords(move.to);
    
    const distanceToKing = Math.abs(kingRow - toRow) + Math.abs(kingCol - toCol);
    if (distanceToKing <= 2 && movingPiece.type !== 'k') {
      score += 20; // Bonus for keeping pieces near king
    }
    
    return score;
  }

  private evaluateCenterControl(move: PossibleMove, movingPiece: Piece): number {
    const [toRow, toCol] = this.squareToCoords(move.to);
    const centerSquares = [[3, 3], [3, 4], [4, 3], [4, 4]];
    const extendedCenter = [[2, 2], [2, 3], [2, 4], [2, 5], [3, 2], [3, 5], [4, 2], [4, 5], [5, 2], [5, 3], [5, 4], [5, 5]];
    
    let score = 0;
    
    // Bonus for occupying center squares
    if (centerSquares.some(([r, c]) => r === toRow && c === toCol)) {
      score += this.getPieceValue(movingPiece.type) * 0.3;
    }
    
    // Smaller bonus for extended center
    if (extendedCenter.some(([r, c]) => r === toRow && c === toCol)) {
      score += this.getPieceValue(movingPiece.type) * 0.1;
    }
    
    return score;
  }

  private evaluateDevelopment(move: PossibleMove, board: (Piece | null)[][], movingPiece: Piece): number {
    let score = 0;
    
    const [fromRow, fromCol] = this.squareToCoords(move.from);
    const [toRow, toCol] = this.squareToCoords(move.to);
    
    // Bonus for developing pieces from back rank
    const backRank = this.aiSide === 'white' ? 7 : 0;
    if (fromRow === backRank && (movingPiece.type === 'n' || movingPiece.type === 'b')) {
      score += 40;
    }
    
    // Penalty for moving the same piece multiple times in opening
    // (This would need move history to implement fully)
    
    // Bonus for getting pieces off the back rank
    if (fromRow === backRank && toRow !== backRank) {
      score += 20;
    }
    
    return score;
  }

  private getPositionValue(piece: Piece, row: number, col: number): number {
    const pieceSquareTables = this.getPieceSquareTable(piece.type);
    const index = this.aiSide === 'white' ? row * 8 + col : (7 - row) * 8 + col;
    return pieceSquareTables[index] || 0;
  }

  private getPieceValue(pieceType: string): number {
    switch (pieceType) {
      case 'p': return 100;
      case 'n': return 320;
      case 'b': return 330;
      case 'r': return 500;
      case 'q': return 900;
      case 'k': return 20000;
      default: return 0;
    }
  }

  private getPieceSquareTable(pieceType: string): number[] {
    // Simplified piece-square tables (white's perspective)
    const tables: { [key: string]: number[] } = {
      'p': [
        0,  0,  0,  0,  0,  0,  0,  0,
        50, 50, 50, 50, 50, 50, 50, 50,
        10, 10, 20, 30, 30, 20, 10, 10,
        5,  5, 10, 25, 25, 10,  5,  5,
        0,  0,  0, 20, 20,  0,  0,  0,
        5, -5,-10,  0,  0,-10, -5,  5,
        5, 10, 10,-20,-20, 10, 10,  5,
        0,  0,  0,  0,  0,  0,  0,  0
      ],
      'n': [
        -50,-40,-30,-30,-30,-30,-40,-50,
        -40,-20,  0,  0,  0,  0,-20,-40,
        -30,  0, 10, 15, 15, 10,  0,-30,
        -30,  5, 15, 20, 20, 15,  5,-30,
        -30,  0, 15, 20, 20, 15,  0,-30,
        -30,  5, 10, 15, 15, 10,  5,-30,
        -40,-20,  0,  5,  5,  0,-20,-40,
        -50,-40,-30,-30,-30,-30,-40,-50
      ],
      'b': [
        -20,-10,-10,-10,-10,-10,-10,-20,
        -10,  0,  0,  0,  0,  0,  0,-10,
        -10,  0,  5, 10, 10,  5,  0,-10,
        -10,  5,  5, 10, 10,  5,  5,-10,
        -10,  0, 10, 10, 10, 10,  0,-10,
        -10, 10, 10, 10, 10, 10, 10,-10,
        -10,  5,  0,  0,  0,  0,  5,-10,
        -20,-10,-10,-10,-10,-10,-10,-20
      ],
      'r': [
        0,  0,  0,  0,  0,  0,  0,  0,
        5, 10, 10, 10, 10, 10, 10,  5,
        -5,  0,  0,  0,  0,  0,  0, -5,
        -5,  0,  0,  0,  0,  0,  0, -5,
        -5,  0,  0,  0,  0,  0,  0, -5,
        -5,  0,  0,  0,  0,  0,  0, -5,
        -5,  0,  0,  0,  0,  0,  0, -5,
        0,  0,  0,  5,  5,  0,  0,  0
      ],
      'q': [
        -20,-10,-10, -5, -5,-10,-10,-20,
        -10,  0,  0,  0,  0,  0,  0,-10,
        -10,  0,  5,  5,  5,  5,  0,-10,
        -5,  0,  5,  5,  5,  5,  0, -5,
        0,  0,  5,  5,  5,  5,  0, -5,
        -10,  5,  5,  5,  5,  5,  0,-10,
        -10,  0,  5,  0,  0,  0,  0,-10,
        -20,-10,-10, -5, -5,-10,-10,-20
      ],
      'k': [
        -30,-40,-40,-50,-50,-40,-40,-30,
        -30,-40,-40,-50,-50,-40,-40,-30,
        -30,-40,-40,-50,-50,-40,-40,-30,
        -30,-40,-40,-50,-50,-40,-40,-30,
        -20,-30,-30,-40,-40,-30,-30,-20,
        -10,-20,-20,-20,-20,-20,-20,-10,
        20, 20,  0,  0,  0,  0, 20, 20,
        20, 30, 10,  0,  0, 10, 30, 20
      ]
    };
    
    return tables[pieceType] || Array(64).fill(0);
  }

  private selectFromTopMoves(evaluatedMoves: AIMove[]): AIMove[] {
    if (evaluatedMoves.length === 0) return [];
    
    let selectionSize = 1;
    
    // Add randomness based on difficulty
    switch (this.difficulty) {
      case 'easy':
        selectionSize = Math.min(5, evaluatedMoves.length);
        break;
      case 'medium':
        selectionSize = Math.min(3, evaluatedMoves.length);
        break;
      case 'hard':
        selectionSize = 1; // Always best move
        break;
    }
    
    const topMoves = evaluatedMoves.slice(0, selectionSize);
    
    // Random selection from top moves
    if (selectionSize > 1) {
      const randomIndex = Math.floor(Math.random() * topMoves.length);
      return [topMoves[randomIndex]];
    }
    
    return [topMoves[0]];
  }

  private getReasoningForMove(move: PossibleMove, board: (Piece | null)[][], settings: GameSettings, score: number): string {
    const [fromRow, fromCol] = this.squareToCoords(move.from);
    const [toRow, toCol] = this.squareToCoords(move.to);
    
    const movingPiece = board[fromRow][fromCol];
    const targetPiece = board[toRow][toCol];
    
    if (!movingPiece) return "Invalid move";
    
    let reasoning = `Move ${this.pieceToString(movingPiece)} from ${move.from} to ${move.to}`;
    
    if (targetPiece) {
      reasoning += ` (captures ${this.pieceToString(targetPiece)})`;
      
      if (settings.enableHitPointsSystem && targetPiece.hitPoints) {
        reasoning += ` [${targetPiece.hitPoints} HP]`;
      }
    }
    
    if (score > 150) {
      reasoning += " - High priority move!";
    } else if (score > 50) {
      reasoning += " - Good tactical move";
    } else if (score < -50) {
      reasoning += " - Defensive necessity";
    }
    
    return reasoning;
  }

  private pieceToString(piece: Piece): string {
    const names: { [key: string]: string } = {
      'p': 'Pawn', 'n': 'Knight', 'b': 'Bishop', 
      'r': 'Rook', 'q': 'Queen', 'k': 'King'
    };
    return names[piece.type] || 'Unknown';
  }

  private squareToCoords(square: Square): [number, number] {
    const file = square.charCodeAt(0) - 97; // 'a' = 0
    const rank = 8 - parseInt(square[1]); // '8' = 0
    return [rank, file];
  }

  private coordsToSquare(row: number, col: number): Square {
    return `${String.fromCharCode(97 + col)}${8 - row}` as Square;
  }

  private findKing(board: (Piece | null)[][], color: 'w' | 'b'): Square | null {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.type === 'k' && piece.color === color) {
          return this.coordsToSquare(row, col);
        }
      }
    }
    return null;
  }

  private isSquareUnderAttack(square: Square, board: (Piece | null)[][], attackingColor: 'w' | 'b'): boolean {
    const [targetRow, targetCol] = this.squareToCoords(square);
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.color === attackingColor) {
          if (this.canPieceAttackSquare(piece, row, col, targetRow, targetCol, board)) {
            return true;
          }
        }
      }
    }
    
    return false;
  }

  private canPieceAttackSquare(piece: Piece, fromRow: number, fromCol: number, toRow: number, toCol: number, board: (Piece | null)[][]): boolean {
    // Simplified attack calculation (doesn't need to be perfect for AI evaluation)
    const dr = toRow - fromRow;
    const dc = toCol - fromCol;
    
    switch (piece.type) {
      case 'p':
        const dir = piece.color === 'w' ? -1 : 1;
        return Math.abs(dc) === 1 && dr === dir;
      case 'n':
        return (Math.abs(dr) === 2 && Math.abs(dc) === 1) || (Math.abs(dr) === 1 && Math.abs(dc) === 2);
      case 'b':
        return Math.abs(dr) === Math.abs(dc) && this.isPathClear(fromRow, fromCol, toRow, toCol, board);
      case 'r':
        return (dr === 0 || dc === 0) && this.isPathClear(fromRow, fromCol, toRow, toCol, board);
      case 'q':
        return (Math.abs(dr) === Math.abs(dc) || dr === 0 || dc === 0) && this.isPathClear(fromRow, fromCol, toRow, toCol, board);
      case 'k':
        return Math.abs(dr) <= 1 && Math.abs(dc) <= 1;
      default:
        return false;
    }
  }

  private isPathClear(fromRow: number, fromCol: number, toRow: number, toCol: number, board: (Piece | null)[][]): boolean {
    const dr = toRow - fromRow;
    const dc = toCol - fromCol;
    const stepR = dr === 0 ? 0 : dr > 0 ? 1 : -1;
    const stepC = dc === 0 ? 0 : dc > 0 ? 1 : -1;
    const dist = Math.max(Math.abs(dr), Math.abs(dc));
    
    for (let i = 1; i < dist; i++) {
      if (board[fromRow + i * stepR][fromCol + i * stepC]) {
        return false;
      }
    }
    
    return true;
  }
} 