"use client";

import { Square as SquareType } from "chess.js";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { GameState, PieceCooldown } from "@/app/models/Game";
import { Square as SquareComponent } from "./Square";
import { BulletCounter } from "./BulletCounter";
import { PawnPromotion } from "./PawnPromotion";
import { PieceGenerationTimer } from "./PieceGenerationTimer";
import { BoardOverlays } from "./BoardOverlays";
import { useChessBoardState } from "@/lib/hooks/useChessBoardState";
import { useGameEffects } from "@/lib/hooks/useGameEffects";
import { useBoardCustomization } from "@/lib/hooks/useBoardCustomization";
import { BoardCustomization } from "./BoardCustomization";
import { getPieceAtSquare, isSquareOnCooldown, getCooldownsForSquare, getNextResetTime, squareToCoords } from "@/lib/utils/chessUtils";
import { Button } from "../ui/button";
import { Flag } from "lucide-react";

interface ChessBoardProps {
  gameState: GameState & { board: (any[] | null)[] };
  playerId: string;
  playerSide: "white" | "black";
  onMove: (from: SquareType, to: SquareType, promotion?: string) => void;
  possibleMoves: { [square: string]: string[] };
  pieceCooldowns: PieceCooldown[];
  movesLeft: number;
  onMoveSuccess?: (moveId: string) => void;
  onMoveError?: (moveId: string, error: string) => void;
  onSurrender?: () => void;
  isSpectator?: boolean;
}

export function ChessBoard({
  gameState,
  playerId,
  playerSide,
  onMove,
  possibleMoves,
  pieceCooldowns,
  movesLeft,
  onMoveSuccess,
  onMoveError,
  onSurrender,
  isSpectator,
}: ChessBoardProps) {
  const [pendingPromotion, setPendingPromotion] = useState<{from: SquareType, to: SquareType} | null>(null);
  const [pendingMoveIds, setPendingMoveIds] = useState<Map<string, string>>(new Map()); // from-to -> moveId
  
  const boardState = useChessBoardState({
    gameState,
    playerId,
    movesLeft,
    playerSide,
    serverPossibleMoves: possibleMoves,
  });

  const boardCustomization = useBoardCustomization();
  const gameEffects = useGameEffects({ gameState });

  const {
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
  } = boardState;

  // Handle server move errors - revert optimistic moves
  useEffect(() => {
    if (onMoveError) {
      // When a move fails on the server, we need to revert the optimistic move
      const handleMoveError = (moveKey: string, error: string) => {
        const moveId = pendingMoveIds.get(moveKey);
        if (moveId) {
          removeOptimisticMoveAndRefresh(moveId);
          setPendingMoveIds(prev => {
            const newMap = new Map(prev);
            newMap.delete(moveKey);
            return newMap;
          });
          triggerMagazineError(`Move failed: ${error}`);
        }
      };
      
      // We'll use this in the move handling logic
    }
  }, [onMoveError, pendingMoveIds, removeOptimisticMoveAndRefresh, triggerMagazineError]);

  // Handle server move success - clean up tracking
  useEffect(() => {
    if (onMoveSuccess) {
      const handleMoveSuccess = (moveId: string) => {
        // Find and remove the move from tracking
        for (const [moveKey, id] of pendingMoveIds.entries()) {
          if (id === moveId) {
            setPendingMoveIds(prev => {
              const newMap = new Map(prev);
              newMap.delete(moveKey);
              return newMap;
            });
            break;
          }
        }
      };
    }
  }, [onMoveSuccess, pendingMoveIds]);

  const handlePromotionSelect = (piece: string) => {
    if (pendingPromotion) {
      const { from, to } = pendingPromotion;
      
      // Enhanced optimistic move for promotion
      const result = addOptimisticMoveWithValidation(from, to, piece);
      
      if (result.success && result.moveId) {
        // Track the move
        const moveKey = `${from}-${to}`;
        setPendingMoveIds(prev => new Map(prev).set(moveKey, result.moveId!));
        
        // Update local moves count optimistically
        setLocalMovesLeft(prev => Math.max(0, prev - 1));
        
        // Send to server
        onMove(from, to, piece);
      } else {
        triggerMagazineError(result.error || "Promotion failed");
      }
      
      setPendingPromotion(null);
    }
  };

  const handleSquareClick = (square: SquareType) => {
    if (!selectedSquare) {
      const piece = getPieceAtSquare(square, optimisticBoard);
      if (piece && (piece === piece.toUpperCase() ? "white" : "black") === playerSide) {
        if (isSquareOnCooldown(square, playerId, pieceCooldowns)) {
          const cooldown = pieceCooldowns.find((pc) => pc.square === square);
          const remainingSeconds = cooldown
            ? Math.ceil((cooldown.availableAt.getTime() - Date.now()) / 1000)
            : 0;
          triggerWiggle(`Piece on cooldown for ${remainingSeconds}s`);
          return;
        }
        setSelectedSquare(square);
      } else {
        triggerWiggle("Select your own piece first");
      }
      return;
    }

    if (selectedSquare === square) {
      setSelectedSquare(null);
      return;
    }

    if (isPossibleMove(square)) {
      // Enhanced pre-validation: Check if player can make move (including pending moves)
      if (!canMakeMove(playerId)) {
        triggerMagazineError("No bullets available! Wait for reload...");
        return;
      }
      
      // Use enhanced optimistic move with validation
      const result = addOptimisticMoveWithValidation(selectedSquare, square);
      
      if (!result.success) {
        triggerMagazineError(result.error || "Cannot make move");
        return;
      }
      
      // Track the move for error handling
      const moveKey = `${selectedSquare}-${square}`;
      if (result.moveId) {
        setPendingMoveIds(prev => new Map(prev).set(moveKey, result.moveId!));
      }
      
      // Update local moves count optimistically
      setLocalMovesLeft(prev => Math.max(0, prev - 1));
      
      // Check for pawn promotion
      const fromCoords = squareToCoords(selectedSquare);
      const toCoords = squareToCoords(square);
      
      if (fromCoords && toCoords) {
        const [fromRow, fromCol] = fromCoords;
        const [toRow] = toCoords;
        const pieceObj = optimisticBoard[fromRow]?.[fromCol];
        
        if (pieceObj && pieceObj.type === 'p') {
          const promotionRow = pieceObj.color === 'w' ? 0 : 7; // White promotes on rank 8 (row 0), black on rank 1 (row 7)
          
          if (toRow === promotionRow) {
            // Handle promotion
            setPendingPromotion({ from: selectedSquare, to: square });
            setSelectedSquare(null);
            return;
          }
        }
      }
      
      // Send move to server (regular move, no promotion)
      onMove(selectedSquare, square);
      setSelectedSquare(null);
      
      // Move completed successfully
    } else {
      const piece = getPieceAtSquare(square, optimisticBoard);
      if (piece && (piece === piece.toUpperCase() ? "white" : "black") === playerSide) {
        if (isSquareOnCooldown(square, playerId, pieceCooldowns)) {
          const cooldown = pieceCooldowns.find((pc) => pc.square === square);
          const remainingSeconds = cooldown
            ? Math.ceil((cooldown.availableAt.getTime() - Date.now()) / 1000)
            : 0;
          triggerWiggle(`Piece on cooldown for ${remainingSeconds}s`);
          return;
        }
        setSelectedSquare(square);
      } else {
        setSelectedSquare(null);
      }
    }
  };

  const isPossibleMove = (square: SquareType): boolean => {
    return selectedSquare
      ? effectivePossibleMoves[selectedSquare]?.includes(square) || false
      : false;
  };

  const renderSquare = (row: number, col: number) => {
    const file = String.fromCharCode(97 + col);
    const rank = 8 - row;
    const square = `${file}${rank}` as SquareType;
    const piece = getPieceAtSquare(square, optimisticBoard);
    const isLight = (row + col) % 2 === 0;
    const isSelected = selectedSquare === square;
    const cooldowns = getCooldownsForSquare(square, pieceCooldowns);
    const isPlayerPiece = Boolean(
      piece && (piece === piece.toUpperCase() ? "white" : "black") === playerSide
    );
    const isPossibleTarget = isPossibleMove(square);
    
    const lastMove = gameState.moveHistory[gameState.moveHistory.length - 1];
    const isLastMoveFrom = lastMove ? lastMove.from === square : false;
    
    const currentMovesLeft = getPlayerMovesLeft(playerId);
    const canMakeMove = currentMovesLeft > 0;
    
    const nextMoveAvailableAt = playerBulletReloadTimes.length > 0 
      ? playerBulletReloadTimes.sort((a, b) => a.getTime() - b.getTime())[0]
      : undefined;
    
    const isKing = piece && (piece.toLowerCase() === 'k');
    const isWhiteKing = piece === 'K';
    const isBlackKing = piece === 'k';
    const isKingInCheck = isKing && gameState.check ? (
      (isWhiteKing && gameState.check.whiteInCheck) ||
      (isBlackKing && gameState.check.blackInCheck)
    ) : false;
    
    // For hit points, we need to use the server board state (not optimistic)
    // because hit points are calculated server-side
    const boardPiece = gameState.board[row]?.[col];
    const hitPoints = boardPiece?.hitPoints;
    const maxHitPoints = gameState.settings?.enableHitPointsSystem ? 3 : undefined;
    
    const isBeingAttacked = gameEffects.shakingSquares.has(square);
    const isTakingDamage = gameEffects.damageShakingSquares.has(square);
    
    const isRookSquare = ['a1', 'h1', 'a8', 'h8'].includes(square);
    const isEmpty = !piece;
    const hasActiveCooldown = gameState.pieceGenerationCooldowns?.[square];
    const showGenerationTimer = isRookSquare && isEmpty && gameState.settings?.enableRandomPieceGeneration && hasActiveCooldown;
    
    // Add visual indicator for pending optimistic moves
    const isPendingMove = pendingMoves.some(move => move.from === square || move.to === square);
    
    return (
      <div key={`square-${row}-${col}`} className="relative">
        <SquareComponent
          square={square}
          piece={piece}
          isLight={isLight}
          isSelected={isSelected}
          isPlayerPiece={isPlayerPiece}
          isPossibleTarget={isPossibleTarget}
          cooldowns={cooldowns}
          playerId={playerId}
          playerSide={playerSide}
          isLastMoveFrom={isLastMoveFrom}
          canMakeMove={canMakeMove}
          nextMoveAvailableAt={nextMoveAvailableAt}
          isKingInCheck={isKingInCheck}
          hitPoints={hitPoints}
          maxHitPoints={maxHitPoints}
          isRandomGenerationEnabled={gameState.settings?.enableRandomPieceGeneration}
          isBeingAttacked={isBeingAttacked}
          isTakingDamage={isTakingDamage}
          boardTheme={boardCustomization.boardTheme}
          pieceTheme={boardCustomization.pieceTheme}
          onClick={handleSquareClick}
          isPendingMove={isPendingMove}
        />
        
        {showGenerationTimer && (
          <PieceGenerationTimer
            square={square}
            cooldownEndTime={gameState.pieceGenerationCooldowns[square]}
            isEnabled={true}
            playerSide={playerSide}
          />
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Layout */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between px-2 py-1 bg-card/50 border-b">
          <div className="flex items-center gap-2">
            <Badge
              variant={playerSide === "white" ? "default" : "secondary"}
              className="text-xs rounded-md px-1 py-0.5"
            >
              {playerSide === "white" ? "♔ White" : "♚ Black"}
            </Badge>
            {errorMessage && (
              <p className="text-xs text-red-500 animate-pulse">{errorMessage}</p>
            )}
          </div>
          <div className="flex items-center gap-1">
            {boardCustomization.isLoaded && (
              <BoardCustomization
                selectedBoardTheme={boardCustomization.boardTheme}
                selectedPieceTheme={boardCustomization.pieceTheme}
                onBoardThemeChange={boardCustomization.setBoardTheme}
                onPieceThemeChange={boardCustomization.setPieceTheme}
              />
            )}
            {/* Mobile Surrender Button */}
            {!isSpectator && gameState.status === 'playing' && onSurrender && (
              <Button
                variant="destructive"
                size="sm"
                onClick={onSurrender}
                className="h-6 w-6 p-0 rounded-full bg-red-600 hover:bg-red-700 border-2 border-red-800 shadow-lg"
                title="Surrender Game"
              >
                <Flag className="h-2.5 w-2.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Opponent bullets at top */}
        {opponent && (
          <div className="flex justify-center items-center py-1 px-2 bg-background border-b">
            <BulletCounter
              movesLeft={opponentMovesLeft}
              maxMoves={maxMoves}
              isReloading={isOpponentReloading}
              isOpponent={true}
              playerName={opponent.name || "Opponent"}
              bulletReloadTimes={opponentBulletReloadTimes}
              cooldownSeconds={10}
            />
          </div>
        )}

        <div className="p-1">
          <div className="aspect-square w-full max-w-none">
            <div className={`relative ${errorMessage ? (playerSide === "black" ? "animate-wiggle-black" : "animate-wiggle") : ""}`}>
              <div className={`grid grid-cols-8 gap-0 border-0 rounded-lg overflow-hidden shadow-sm ${playerSide === "black" ? "rotate-180" : ""}`}>
                {Array.from({ length: 8 }).map((_, row) =>
                  Array.from({ length: 8 }).map((_, col) => {
                    const squareElement = renderSquare(row, col);
                    if (playerSide === "black") {
                      return (
                        <div key={`${row}-${col}`} className="rotate-180">
                          {squareElement}
                        </div>
                      );
                    }
                    return squareElement;
                  })
                )}
              </div>
              
              <BoardOverlays
                lastMoveIndicator={gameEffects.lastMoveIndicator}
                captureEffect={gameEffects.captureEffect}
                pieceGenerationEffects={gameEffects.pieceGenerationEffects}
                attackIndicators={gameEffects.attackIndicators}
                gameState={gameState}
                playerSide={playerSide}
                onEffectComplete={gameEffects.handleEffectComplete}
              />
            </div>
          </div>
        </div>

        {/* Player bullets at bottom */}
        <div className="flex justify-center items-center py-1 px-2 bg-background border-t">
          <BulletCounter
            movesLeft={localMovesLeft}
            maxMoves={maxMoves}
            isReloading={isReloading}
            isOpponent={false}
            playerName={gameState.players.find(p => p.id === playerId)?.name || "You"}
            bulletReloadTimes={playerBulletReloadTimes}
            cooldownSeconds={10}
            magazineError={magazineError}
            magazineErrorKey={magazineErrorKey}
          />
        </div>

        <div className="px-2 py-1 bg-card/50 border-t">
          <div className="flex justify-center gap-4 text-xs text-muted-foreground">
            {gameState.settings && (
              <div className="flex items-center gap-1">
                <Badge variant="outline" className="text-xs px-1 py-0">
                  {gameState.settings.pieceCooldownSeconds}s
                </Badge>
                <span>cooldown</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-xs px-1 py-0">
                {(() => {
                  const nextReset = getNextResetTime(pieceCooldowns);
                  if (!nextReset) return "0";
                  const remainingSeconds = Math.ceil((nextReset.getTime() - Date.now()) / 1000);
                  return Math.max(0, remainingSeconds);
                })()}s
              </Badge>
              <span>reload</span>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <Card className="rounded-xl sm:rounded-2xl hidden sm:block border-0">
        <CardContent className="p-1">
          {/* Top controls bar */}
          <div className="flex items-center justify-between mb-1">
            {/* Left side: Player badge */}
            <Badge
              variant={playerSide === "white" ? "default" : "secondary"}
              className="text-xs rounded-md px-2 py-1"
            >
              {playerSide === "white" ? "♔ White" : "♚ Black"}
            </Badge>

            {/* Right side: Controls */}
            <div className="flex items-center gap-1">
              {boardCustomization.isLoaded && (
                <BoardCustomization
                  selectedBoardTheme={boardCustomization.boardTheme}
                  selectedPieceTheme={boardCustomization.pieceTheme}
                  onBoardThemeChange={boardCustomization.setBoardTheme}
                  onPieceThemeChange={boardCustomization.setPieceTheme}
                />
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-1 items-center">
            {/* Left side: Player bullets */}
            <div className="flex flex-row sm:flex-col gap-1 sm:gap-2 min-w-[80px] sm:min-w-[80px] justify-center">
              <BulletCounter
                movesLeft={localMovesLeft}
                maxMoves={maxMoves}
                isReloading={isReloading}
                isOpponent={false}
                playerName={gameState.players.find(p => p.id === playerId)?.name || "You"}
                bulletReloadTimes={playerBulletReloadTimes}
                cooldownSeconds={10}
                magazineError={magazineError}
                magazineErrorKey={magazineErrorKey}
              />
            </div>

            {/* Board section */}
            <div className="flex-1 w-full">
              <div className="aspect-square max-w-xs sm:max-w-2xl mx-auto">
                <div className={`relative ${errorMessage ? (playerSide === "black" ? "animate-wiggle-black" : "animate-wiggle") : ""}`}>
                  <div className={`grid grid-cols-8 gap-0 border-0 rounded-lg sm:rounded-2xl overflow-hidden shadow-sm sm:shadow-lg ${playerSide === "black" ? "rotate-180" : ""}`}>
                    {Array.from({ length: 8 }).map((_, row) =>
                      Array.from({ length: 8 }).map((_, col) => {
                        const squareElement = renderSquare(row, col);
                        if (playerSide === "black") {
                          return (
                            <div key={`${row}-${col}`} className="rotate-180">
                              {squareElement}
                            </div>
                          );
                        }
                        return squareElement;
                      })
                    )}
                  </div>
                  
                  <BoardOverlays
                    lastMoveIndicator={gameEffects.lastMoveIndicator}
                    captureEffect={gameEffects.captureEffect}
                    pieceGenerationEffects={gameEffects.pieceGenerationEffects}
                    attackIndicators={gameEffects.attackIndicators}
                    gameState={gameState}
                    playerSide={playerSide}
                    onEffectComplete={gameEffects.handleEffectComplete}
                  />
                </div>
              </div>
            </div>

            {/* Right side: Opponent bullets */}
            <div className="flex flex-row sm:flex-col gap-1 sm:gap-2 min-w-[80px] sm:min-w-[80px] justify-center">
              {opponent ? (
                <BulletCounter
                  movesLeft={opponentMovesLeft}
                  maxMoves={maxMoves}
                  isReloading={isOpponentReloading}
                  isOpponent={true}
                  playerName={opponent.name || "Opponent"}
                  bulletReloadTimes={opponentBulletReloadTimes}
                  cooldownSeconds={10}
                />
              ) : (
                <div className="min-w-[80px]"></div>
              )}
            </div>
          </div>

          <div className="mt-0.5 text-center space-y-0.5">
            {errorMessage && (
              <p className="text-xs text-red-500 animate-pulse">{errorMessage}</p>
            )}

            <div className="flex justify-center gap-1 sm:gap-2 text-xs text-muted-foreground">
              {gameState.settings && (
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    {gameState.settings.pieceCooldownSeconds}s
                  </Badge>
                  <span className="sm:hidden">cooldown</span>
                  <span className="hidden sm:inline">piece cooldown</span>
                </div>
              )}
              
            
            </div>
          </div>
        </CardContent>
      </Card>
      
      {pendingPromotion && (
        <PawnPromotion
          isOpen={true}
          playerSide={playerSide}
          onSelect={handlePromotionSelect}
        />
      )}
    </>
  );
}
