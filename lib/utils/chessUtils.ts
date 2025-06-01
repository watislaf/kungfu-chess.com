import { Square as SquareType } from "chess.js";
import { PieceCooldown } from "@/app/models/Game";

export function getPieceAtSquare(square: SquareType, board: (any[] | null)[]): string | null {
  if (!board) return null;
  const file = square.charCodeAt(0) - 97;
  const rank = 8 - parseInt(square[1]);
  const piece = board[rank]?.[file];
  if (!piece) return null;
  
  const pieceChar = (() => {
    switch (piece.type) {
      case "p": return piece.color === "w" ? "P" : "p";
      case "n": return piece.color === "w" ? "N" : "n";
      case "b": return piece.color === "w" ? "B" : "b";
      case "r": return piece.color === "w" ? "R" : "r";
      case "q": return piece.color === "w" ? "Q" : "q";
      case "k": return piece.color === "w" ? "K" : "k";
      default: return null;
    }
  })();
  
  return pieceChar;
}

// Helper function to convert square notation to coordinates
export function squareToCoords(square: SquareType): [number, number] | null {
  const file = square.charCodeAt(0) - 97; // a=0, b=1, etc.
  const rank = 8 - parseInt(square[1]); // 8=0, 7=1, etc.
  
  if (file < 0 || file > 7 || rank < 0 || rank > 7) {
    return null;
  }
  
  return [rank, file];
}

// Helper function to convert coordinates to square notation
export function coordsToSquare(rank: number, file: number): SquareType | null {
  if (rank < 0 || rank > 7 || file < 0 || file > 7) {
    return null;
  }
  
  const fileChar = String.fromCharCode(97 + file); // 0=a, 1=b, etc.
  const rankChar = String(8 - rank); // 0=8, 1=7, etc.
  
  return `${fileChar}${rankChar}` as SquareType;
}

// Get piece info at coordinates
function getPieceAtCoords(board: (any[] | null)[], rank: number, file: number): any | null {
  if (rank < 0 || rank > 7 || file < 0 || file > 7) return null;
  return board[rank]?.[file] || null;
}

// Check if square is occupied by enemy piece
function isEnemyPiece(board: (any[] | null)[], rank: number, file: number, color: string): boolean {
  const piece = getPieceAtCoords(board, rank, file);
  return piece && piece.color !== color;
}

// Check if square is occupied by friendly piece
function isFriendlyPiece(board: (any[] | null)[], rank: number, file: number, color: string): boolean {
  const piece = getPieceAtCoords(board, rank, file);
  return piece && piece.color === color;
}

// Check if square is empty
function isEmptySquare(board: (any[] | null)[], rank: number, file: number): boolean {
  return !getPieceAtCoords(board, rank, file);
}

// Get possible moves for a pawn
function getPawnMoves(board: (any[] | null)[], rank: number, file: number, color: string): SquareType[] {
  const moves: SquareType[] = [];
  const direction = color === 'w' ? -1 : 1; // white moves up (rank decreases), black moves down
  const startRank = color === 'w' ? 6 : 1;
  
  // One square forward
  const oneForward = rank + direction;
  if (oneForward >= 0 && oneForward <= 7 && isEmptySquare(board, oneForward, file)) {
    const square = coordsToSquare(oneForward, file);
    if (square) moves.push(square);
    
    // Two squares forward from starting position
    if (rank === startRank && isEmptySquare(board, oneForward + direction, file)) {
      const twoForward = coordsToSquare(oneForward + direction, file);
      if (twoForward) moves.push(twoForward);
    }
  }
  
  // Diagonal captures
  for (const fileOffset of [-1, 1]) {
    const captureRank = rank + direction;
    const captureFile = file + fileOffset;
    if (captureRank >= 0 && captureRank <= 7 && captureFile >= 0 && captureFile <= 7) {
      if (isEnemyPiece(board, captureRank, captureFile, color)) {
        const square = coordsToSquare(captureRank, captureFile);
        if (square) moves.push(square);
      }
    }
  }
  
  return moves;
}

// Get possible moves for a knight
function getKnightMoves(board: (any[] | null)[], rank: number, file: number, color: string): SquareType[] {
  const moves: SquareType[] = [];
  const knightMoves = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1]
  ];
  
  for (const [rankOffset, fileOffset] of knightMoves) {
    const newRank = rank + rankOffset;
    const newFile = file + fileOffset;
    
    if (newRank >= 0 && newRank <= 7 && newFile >= 0 && newFile <= 7) {
      if (!isFriendlyPiece(board, newRank, newFile, color)) {
        const square = coordsToSquare(newRank, newFile);
        if (square) moves.push(square);
      }
    }
  }
  
  return moves;
}

// Get possible moves for sliding pieces (bishop, rook, queen)
function getSlidingMoves(board: (any[] | null)[], rank: number, file: number, color: string, directions: number[][]): SquareType[] {
  const moves: SquareType[] = [];
  
  for (const [rankDir, fileDir] of directions) {
    let newRank = rank + rankDir;
    let newFile = file + fileDir;
    
    while (newRank >= 0 && newRank <= 7 && newFile >= 0 && newFile <= 7) {
      if (isFriendlyPiece(board, newRank, newFile, color)) {
        break; // Blocked by friendly piece
      }
      
      const square = coordsToSquare(newRank, newFile);
      if (square) moves.push(square);
      
      if (isEnemyPiece(board, newRank, newFile, color)) {
        break; // Can capture enemy piece but can't continue
      }
      
      newRank += rankDir;
      newFile += fileDir;
    }
  }
  
  return moves;
}

// Get possible moves for a king
function getKingMoves(board: (any[] | null)[], rank: number, file: number, color: string): SquareType[] {
  const moves: SquareType[] = [];
  const kingMoves = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];
  
  for (const [rankOffset, fileOffset] of kingMoves) {
    const newRank = rank + rankOffset;
    const newFile = file + fileOffset;
    
    if (newRank >= 0 && newRank <= 7 && newFile >= 0 && newFile <= 7) {
      if (!isFriendlyPiece(board, newRank, newFile, color)) {
        const square = coordsToSquare(newRank, newFile);
        if (square) moves.push(square);
      }
    }
  }
  
  return moves;
}

// Calculate possible moves for a piece at given square
export function getMovesForPiece(board: (any[] | null)[], square: SquareType): SquareType[] {
  const coords = squareToCoords(square);
  if (!coords) return [];
  
  const [rank, file] = coords;
  const piece = getPieceAtCoords(board, rank, file);
  if (!piece) return [];
  
  const { type, color } = piece;
  
  switch (type) {
    case 'p':
      return getPawnMoves(board, rank, file, color);
    case 'n':
      return getKnightMoves(board, rank, file, color);
    case 'b':
      return getSlidingMoves(board, rank, file, color, [[-1, -1], [-1, 1], [1, -1], [1, 1]]);
    case 'r':
      return getSlidingMoves(board, rank, file, color, [[-1, 0], [1, 0], [0, -1], [0, 1]]);
    case 'q':
      return getSlidingMoves(board, rank, file, color, [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1]
      ]);
    case 'k':
      return getKingMoves(board, rank, file, color);
    default:
      return [];
  }
}

// Calculate all possible moves for all pieces of a player
export function calculateOptimisticPossibleMoves(board: (any[] | null)[], playerColor: string): { [square: string]: string[] } {
  const possibleMoves: { [square: string]: string[] } = {};
  
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const piece = getPieceAtCoords(board, rank, file);
      if (piece && piece.color === playerColor.charAt(0)) { // 'white' -> 'w', 'black' -> 'b'
        const square = coordsToSquare(rank, file);
        if (square) {
          const moves = getMovesForPiece(board, square);
          if (moves.length > 0) {
            possibleMoves[square] = moves;
          }
        }
      }
    }
  }
  
  return possibleMoves;
}

export function isSquareOnCooldown(
  square: SquareType,
  playerId: string,
  pieceCooldowns: PieceCooldown[]
): boolean {
  const now = new Date();
  return pieceCooldowns.some(
    (pc) => pc.square === square && pc.playerId === playerId && pc.availableAt > now
  );
}

export function getCooldownsForSquare(
  square: SquareType,
  pieceCooldowns: PieceCooldown[]
): PieceCooldown[] {
  const now = new Date();
  return pieceCooldowns.filter(
    (pc) => pc.square === square && pc.availableAt > now
  );
}

export function getNextResetTime(pieceCooldowns: PieceCooldown[]): Date | null {
  const now = new Date();
  const activeCooldowns = pieceCooldowns.filter(pc => pc.availableAt > now);
  
  if (activeCooldowns.length === 0) return null;
  
  const nextReset = activeCooldowns.reduce((earliest, current) => {
    return current.availableAt < earliest ? current.availableAt : earliest;
  }, activeCooldowns[0].availableAt);
  
  return nextReset;
} 