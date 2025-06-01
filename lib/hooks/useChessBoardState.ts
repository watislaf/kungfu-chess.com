import { useState, useEffect, useCallback, useMemo } from "react";
import { Square as SquareType } from "chess.js";
import { GameState, PieceCooldown } from "@/app/models/Game";
import { calculateOptimisticPossibleMoves, squareToCoords } from "@/lib/utils/chessUtils";

interface UseChessBoardStateProps {
  gameState: GameState & { board: (any[] | null)[] };
  playerId: string;
  movesLeft: number;
  playerSide: "white" | "black";
  serverPossibleMoves?: { [square: string]: string[] };
}

interface OptimisticMove {
  id: string;
  from: SquareType;
  to: SquareType;
  promotion?: string;
  timestamp: number;
}

export function useChessBoardState({ gameState, playerId, movesLeft, playerSide, serverPossibleMoves }: UseChessBoardStateProps) {
  const [selectedSquare, setSelectedSquare] = useState<SquareType | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isReloading, setIsReloading] = useState(false);
  const [localMovesLeft, setLocalMovesLeft] = useState(movesLeft);
  const [prevOpponentMoves, setPrevOpponentMoves] = useState(0);
  const [isOpponentReloading, setIsOpponentReloading] = useState(false);
  const [playerBulletReloadTimes, setPlayerBulletReloadTimes] = useState<Date[]>([]);
  const [opponentBulletReloadTimes, setOpponentBulletReloadTimes] = useState<Date[]>([]);
  const [magazineError, setMagazineError] = useState<string | null>(null);
  const [magazineErrorKey, setMagazineErrorKey] = useState(0);
  const [prevMovesLeft, setPrevMovesLeft] = useState(movesLeft);
  
  // Optimistic moves state
  const [pendingMoves, setPendingMoves] = useState<OptimisticMove[]>([]);
  const [optimisticBoard, setOptimisticBoard] = useState<(any[] | null)[]>(gameState.board);

  // Calculate optimistic possible moves based on optimistic board
  const optimisticPossibleMoves = useMemo(() => {
    try {
      const allMoves = calculateOptimisticPossibleMoves(optimisticBoard, playerSide);
      
      // Filter out moves from pieces that are on cooldown
      const filteredMoves: { [square: string]: string[] } = {};
      const now = new Date();
      
      for (const [square, moves] of Object.entries(allMoves)) {
        // Check if this piece is on cooldown for this player
        const isOnCooldown = gameState.pieceCooldowns?.some(
          (pc) => pc.square === square && pc.playerId === playerId && pc.availableAt > now
        );
        
        if (!isOnCooldown) {
          filteredMoves[square] = moves;
        }
      }
      
      return filteredMoves;
    } catch (error) {
      console.error('Error calculating optimistic moves:', error);
      return {};
    }
  }, [optimisticBoard, playerSide, gameState.pieceCooldowns, playerId]);

  // Use optimistic moves if available, otherwise fallback to server moves
  const effectivePossibleMoves = useMemo(() => {
    const hasOptimisticMoves = Object.keys(optimisticPossibleMoves).length > 0;
    const hasServerMoves = serverPossibleMoves ? Object.keys(serverPossibleMoves).length > 0 : false;
    
    // If we have pending moves, prefer optimistic calculations
    if (pendingMoves.length > 0 && hasOptimisticMoves) {
      return optimisticPossibleMoves;
    }
    
    // Otherwise use server moves
    return serverPossibleMoves || {};
  }, [optimisticPossibleMoves, serverPossibleMoves, pendingMoves.length]);

  // Apply optimistic move to board
  const applyOptimisticMove = useCallback((board: (any[] | null)[], from: SquareType, to: SquareType): (any[] | null)[] => {
    const newBoard = board.map(row => row ? [...row] : null);
    const fromCoords = squareToCoords(from);
    const toCoords = squareToCoords(to);
    
    if (!fromCoords || !toCoords) return newBoard;
    
    const [fromRow, fromCol] = fromCoords;
    const [toRow, toCol] = toCoords;
    
    // Move piece from source to destination
    if (newBoard[fromRow] && newBoard[toRow]) {
      const piece = newBoard[fromRow][fromCol];
      newBoard[toRow][toCol] = piece;
      newBoard[fromRow][fromCol] = null;
    }
    
    return newBoard;
  }, []);

  // Apply all pending moves to create optimistic board state
  const applyAllPendingMoves = useCallback((baseBoard: (any[] | null)[], moves: OptimisticMove[]): (any[] | null)[] => {
    let currentBoard = baseBoard.map(row => row ? [...row] : null);
    
    // Apply each pending move in sequence
    for (const move of moves) {
      currentBoard = applyOptimisticMove(currentBoard, move.from, move.to);
    }
    
    return currentBoard;
  }, [applyOptimisticMove]);

  // Update optimistic board whenever server board or pending moves change
  useEffect(() => {
    const newOptimisticBoard = applyAllPendingMoves(gameState.board || [], pendingMoves);
    setOptimisticBoard(newOptimisticBoard);
  }, [gameState.board, pendingMoves, applyAllPendingMoves]);

  // Clear pending moves when server state updates (moves have been processed)
  useEffect(() => {
    setPendingMoves([]);
  }, [gameState.board, gameState.fen]);

  // Get opponent info and calculate constants
  const opponent = gameState.players.find(p => p.id !== playerId);
  const maxMoves = gameState.settings?.maxMovesPerPeriod || 3;

  // Helper to calculate moves left for a player (including pending optimistic moves)
  const getPlayerMovesLeft = (pId: string): number => {
    if (!gameState.settings) return 0;
    
    const now = Date.now();
    const rateLimitMs = 10000;
    
    // Get server-confirmed recent moves
    const recentMoves = gameState.playerMoveHistory
      .filter(move => move.playerId === pId)
      .filter(move => {
        const timestamp = move.timestamp instanceof Date ? move.timestamp.getTime() : new Date(move.timestamp).getTime();
        return (now - timestamp) < rateLimitMs;
      })
      .sort((a, b) => {
        const aTime = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime();
        const bTime = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime();
        return bTime - aTime;
      })
      .slice(0, maxMoves);
    
    // Add pending optimistic moves for this player to the count
    const pendingMovesCount = pId === playerId ? pendingMoves.length : 0;
    
    const totalUsedMoves = recentMoves.length + pendingMovesCount;
    return Math.max(0, maxMoves - totalUsedMoves);
  };

  // Check if a move can be made (for pre-optimistic validation)
  const canMakeMove = useCallback((playerId: string): boolean => {
    return getPlayerMovesLeft(playerId) > 0;
  }, [getPlayerMovesLeft]);

  // Enhanced optimistic move with validation
  const addOptimisticMoveWithValidation = useCallback((from: SquareType, to: SquareType, promotion?: string): { success: boolean; moveId?: string; error?: string } => {
    // Pre-check: Can the player make this move?
    if (!canMakeMove(playerId)) {
      return { 
        success: false, 
        error: "No moves available! Wait for reload..." 
      };
    }

    const moveId = `${Date.now()}-${Math.random()}`;
    const newMove: OptimisticMove = {
      id: moveId,
      from,
      to,
      promotion,
      timestamp: Date.now()
    };
    
    // Only add to pending moves - the useEffect will handle updating the optimistic board
    setPendingMoves(prev => [...prev, newMove]);
    
    return { success: true, moveId };
  }, [canMakeMove, playerId]);

  // Remove an optimistic move and refresh board state
  const removeOptimisticMoveAndRefresh = useCallback((moveId: string) => {
    setPendingMoves(prev => prev.filter(move => move.id !== moveId));
    // The useEffect will automatically update the optimistic board
  }, []);

  // Force refresh board state from server (for error recovery)
  const forceRefreshBoardState = useCallback(() => {
    setPendingMoves([]);
    setSelectedSquare(null);
    // The useEffect will automatically update the optimistic board to match server state
  }, []);

  // Clear selection when game state changes
  useEffect(() => {
    setSelectedSquare(null);
  }, [gameState.fen]);

  // Update local moves when prop changes
  useEffect(() => {
    setLocalMovesLeft(movesLeft);
  }, [movesLeft]);

  // Detect reloading when moves increase
  useEffect(() => {
    if (movesLeft > prevMovesLeft) {
      setIsReloading(true);
      setTimeout(() => setIsReloading(false), 1000);
    }
    setPrevMovesLeft(movesLeft);
  }, [movesLeft, prevMovesLeft]);

  const opponentMovesLeft = opponent ? getPlayerMovesLeft(opponent.id) : 0;

  // Detect opponent reloading
  useEffect(() => {
    if (opponentMovesLeft > prevOpponentMoves) {
      setIsOpponentReloading(true);
      setTimeout(() => setIsOpponentReloading(false), 1000);
    }
    setPrevOpponentMoves(opponentMovesLeft);
  }, [opponentMovesLeft, prevOpponentMoves]);

  // Initialize bullet reload times
  useEffect(() => {
    if (!gameState.settings) return;
    
    const rateLimitMs = 10000;
    const now = Date.now();
    
    // Calculate reload times for player
    const playerMoves = gameState.playerMoveHistory
      .filter(move => move.playerId === playerId)
      .map(move => {
        const timestamp = move.timestamp instanceof Date ? move.timestamp.getTime() : new Date(move.timestamp).getTime();
        return {
          timestamp: timestamp,
          reloadTime: new Date(timestamp + rateLimitMs)
        };
      })
      .filter(move => move.reloadTime.getTime() > now)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, maxMoves)
      .map(move => move.reloadTime);
    
    setPlayerBulletReloadTimes(playerMoves);
    
    // Calculate reload times for opponent
    if (opponent) {
      const opponentMoves = gameState.playerMoveHistory
        .filter(move => move.playerId === opponent.id)
        .map(move => {
          const timestamp = move.timestamp instanceof Date ? move.timestamp.getTime() : new Date(move.timestamp).getTime();
          return {
            timestamp: timestamp,
            reloadTime: new Date(timestamp + rateLimitMs)
          };
        })
        .filter(move => move.reloadTime.getTime() > now)
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, maxMoves)
        .map(move => move.reloadTime);
      
      setOpponentBulletReloadTimes(opponentMoves);
    }
  }, [gameState.playerMoveHistory, gameState.settings, playerId, opponent, maxMoves]);

  const triggerWiggle = (message: string) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(null), 2000);
  };

  const triggerMagazineError = (message: string) => {
    setMagazineError(message);
    setMagazineErrorKey((prev) => prev + 1);
    setTimeout(() => setMagazineError(null), 2500);
  };

  // Legacy function for backwards compatibility
  const addOptimisticMove = useCallback((from: SquareType, to: SquareType, promotion?: string): string => {
    const result = addOptimisticMoveWithValidation(from, to, promotion);
    if (result.success && result.moveId) {
      return result.moveId;
    }
    // If move fails, trigger error but still return an ID for consistency
    triggerMagazineError(result.error || "Move failed");
    return `failed-${Date.now()}`;
  }, [addOptimisticMoveWithValidation, triggerMagazineError]);

  // Clear all optimistic moves (legacy function)
  const clearOptimisticMoves = useCallback(() => {
    forceRefreshBoardState();
  }, [forceRefreshBoardState]);

  // Remove an optimistic move (legacy function)
  const removeOptimisticMove = useCallback((moveId: string) => {
    removeOptimisticMoveAndRefresh(moveId);
  }, [removeOptimisticMoveAndRefresh]);

  return {
    selectedSquare,
    setSelectedSquare,
    errorMessage,
    isReloading,
    localMovesLeft,
    setLocalMovesLeft,
    isOpponentReloading,
    playerBulletReloadTimes,
    opponentBulletReloadTimes,
    magazineError,
    magazineErrorKey,
    opponent,
    maxMoves,
    opponentMovesLeft,
    getPlayerMovesLeft,
    canMakeMove,
    triggerWiggle,
    triggerMagazineError,
    pendingMoves,
    optimisticBoard,
    addOptimisticMove,
    clearOptimisticMoves,
    removeOptimisticMove,
    addOptimisticMoveWithValidation,
    removeOptimisticMoveAndRefresh,
    forceRefreshBoardState,
    optimisticPossibleMoves,
    effectivePossibleMoves,
  };
} 