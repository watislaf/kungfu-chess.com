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
  confirmed?: boolean; // Track if move was confirmed by server
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
  const [lastServerMoveCount, setLastServerMoveCount] = useState(0);

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
    for (const move of moves.filter(m => !m.confirmed)) {
      currentBoard = applyOptimisticMove(currentBoard, move.from, move.to);
    }
    
    return currentBoard;
  }, [applyOptimisticMove]);

  // Update optimistic board whenever server board or pending moves change
  useEffect(() => {
    const newOptimisticBoard = applyAllPendingMoves(gameState.board || [], pendingMoves);
    setOptimisticBoard(newOptimisticBoard);
  }, [gameState.board, pendingMoves, applyAllPendingMoves]);

  // Smart move confirmation: clear optimistic moves when server responds with hit points attacks
  useEffect(() => {
    const currentMoveCount = gameState.moveHistory?.length || 0;
    
    if (currentMoveCount > lastServerMoveCount) {
      const lastServerMove = gameState.moveHistory?.[gameState.moveHistory.length - 1];
      
      // Check if the last server move was a hit points attack (from === to)
      if (lastServerMove && lastServerMove.from === lastServerMove.to && lastServerMove.attackTarget) {
        // This was a hit points attack - clear any optimistic moves that match this attack
        setPendingMoves(prev => prev.filter(move => 
          !(move.from === lastServerMove.from && move.to === lastServerMove.attackTarget)
        ));
      } else {
        // Normal move processing - mark recent pending moves as confirmed
        const now = Date.now();
        const recentThreshold = 5000; // 5 seconds
        
        setPendingMoves(prev => prev.map(move => {
          if (!move.confirmed && (now - move.timestamp) < recentThreshold) {
            return { ...move, confirmed: true };
          }
          return move;
        }));
        
        // Clean up old confirmed moves after a delay
        setTimeout(() => {
          setPendingMoves(prev => prev.filter(move => 
            !move.confirmed || (now - move.timestamp) < 10000
          ));
        }, 1000);
      }
      
      setLastServerMoveCount(currentMoveCount);
    }
  }, [gameState.moveHistory, lastServerMoveCount]);

  // Always use optimistic moves for better responsiveness
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
      // Fallback to server moves on error
      return serverPossibleMoves || {};
    }
  }, [optimisticBoard, playerSide, gameState.pieceCooldowns, playerId, serverPossibleMoves]);

  // Use optimistic moves as the primary source for better responsiveness
  const effectivePossibleMoves = useMemo(() => {
    const hasOptimisticMoves = Object.keys(optimisticPossibleMoves).length > 0;
    
    if (hasOptimisticMoves) {
      return optimisticPossibleMoves;
    }
    
    // Fallback to server moves if optimistic calculation fails
    return serverPossibleMoves || {};
  }, [optimisticPossibleMoves, serverPossibleMoves]);

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
    const pendingMovesCount = pId === playerId ? pendingMoves.filter(m => !m.confirmed).length : 0;
    
    const totalUsedMoves = recentMoves.length + pendingMovesCount;
    return Math.max(0, maxMoves - totalUsedMoves);
  };

  // Check if a move can be made (for pre-optimistic validation)
  const canMakeMove = useCallback((playerId: string): boolean => {
    return getPlayerMovesLeft(playerId) > 0;
  }, [getPlayerMovesLeft]);

  // Enhanced optimistic move with immediate validation and responsiveness
  const addOptimisticMoveWithValidation = useCallback((from: SquareType, to: SquareType, promotion?: string): { success: boolean; moveId?: string; error?: string } => {
    // Pre-check: Can the player make this move?
    if (!canMakeMove(playerId)) {
      return { 
        success: false, 
        error: "No moves available! Wait for reload..." 
      };
    }

    // Validate move on current optimistic board
    const fromCoords = squareToCoords(from);
    const toCoords = squareToCoords(to);
    
    if (!fromCoords || !toCoords) {
      return { success: false, error: "Invalid square coordinates" };
    }

    const [fromRow, fromCol] = fromCoords;
    const piece = optimisticBoard[fromRow]?.[fromCol];
    
    if (!piece) {
      return { success: false, error: "No piece on selected square" };
    }

    // Fix: Use piece.color property instead of toUpperCase() on the piece object
    const pieceColor = piece.color === 'w' ? "white" : "black";
    if (pieceColor !== playerSide) {
      return { success: false, error: "Cannot move opponent's piece" };
    }

    // Check if destination is in possible moves
    const possibleMoves = effectivePossibleMoves[from];
    if (!possibleMoves || !possibleMoves.includes(to)) {
      return { success: false, error: "Invalid move for this piece" };
    }

    const moveId = `${Date.now()}-${Math.random()}`;
    const newMove: OptimisticMove = {
      id: moveId,
      from,
      to,
      promotion,
      timestamp: Date.now(),
      confirmed: false
    };
    
    // Add to pending moves immediately for instant UI response
    setPendingMoves(prev => [...prev, newMove]);
    
    return { success: true, moveId };
  }, [canMakeMove, playerId, optimisticBoard, playerSide, effectivePossibleMoves]);

  // Remove an optimistic move and refresh board state
  const removeOptimisticMoveAndRefresh = useCallback((moveId: string) => {
    setPendingMoves(prev => prev.filter(move => move.id !== moveId));
  }, []);

  // Force refresh board state from server (for error recovery)
  const forceRefreshBoardState = useCallback(() => {
    setPendingMoves([]);
    setSelectedSquare(null);
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

  // Track bullet reload times for player
  useEffect(() => {
    if (gameState.settings) {
      const now = Date.now();
      const rateLimitMs = 10000;
      const maxMovesPerPeriod = gameState.settings.maxMovesPerPeriod;
      
      const recentMoves = gameState.playerMoveHistory
        .filter(move => move.playerId === playerId)
        .filter(move => {
          const timestamp = move.timestamp instanceof Date ? move.timestamp.getTime() : new Date(move.timestamp).getTime();
          return (now - timestamp) < rateLimitMs;
        })
        .sort((a, b) => {
          const aTime = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime();
          const bTime = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime();
          return bTime - aTime;
        })
        .slice(0, maxMovesPerPeriod);

      const reloadTimes = recentMoves.map(move => {
        const timestamp = move.timestamp instanceof Date ? move.timestamp.getTime() : new Date(move.timestamp).getTime();
        return new Date(timestamp + rateLimitMs);
      });

      setPlayerBulletReloadTimes(reloadTimes);
    }
  }, [gameState.playerMoveHistory, gameState.settings, playerId]);

  // Track bullet reload times for opponent
  useEffect(() => {
    if (gameState.settings && opponent) {
      const now = Date.now();
      const rateLimitMs = 10000;
      const maxMovesPerPeriod = gameState.settings.maxMovesPerPeriod;
      
      const recentMoves = gameState.playerMoveHistory
        .filter(move => move.playerId === opponent.id)
        .filter(move => {
          const timestamp = move.timestamp instanceof Date ? move.timestamp.getTime() : new Date(move.timestamp).getTime();
          return (now - timestamp) < rateLimitMs;
        })
        .sort((a, b) => {
          const aTime = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime();
          const bTime = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime();
          return bTime - aTime;
        })
        .slice(0, maxMovesPerPeriod);

      const reloadTimes = recentMoves.map(move => {
        const timestamp = move.timestamp instanceof Date ? move.timestamp.getTime() : new Date(move.timestamp).getTime();
        return new Date(timestamp + rateLimitMs);
      });

      setOpponentBulletReloadTimes(reloadTimes);
    }
  }, [gameState.playerMoveHistory, gameState.settings, opponent]);

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