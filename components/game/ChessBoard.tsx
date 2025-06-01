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
import { getPieceAtSquare, isSquareOnCooldown, getCooldownsForSquare, getNextResetTime } from "@/lib/utils/chessUtils";
import { Button } from "../ui/button";

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
  const [isProcessingPromotion, setIsProcessingPromotion] = useState(false);

  const boardState = useChessBoardState({ 
    gameState, 
    playerId, 
    movesLeft, 
    playerSide,
    serverPossibleMoves: possibleMoves 
  });
  const gameEffects = useGameEffects({ gameState });
  const boardCustomization = useBoardCustomization();

  // Use effective possible moves from board state
  const effectivePossibleMoves = boardState.effectivePossibleMoves;

  // Check for pending promotion from game state
  useEffect(() => {
    if (gameState.pendingPromotion && 
        gameState.pendingPromotion.playerId === playerId && 
        !pendingPromotion &&
        !isProcessingPromotion) {
      setPendingPromotion({
        from: gameState.pendingPromotion.from,
        to: gameState.pendingPromotion.to
      });
    }
    
    if (!gameState.pendingPromotion && pendingPromotion && !isProcessingPromotion) {
      setPendingPromotion(null);
      setIsProcessingPromotion(false);
    }
  }, [gameState.pendingPromotion, playerId, pendingPromotion, isProcessingPromotion]);

  const handlePromotionSelect = (piece: string) => {
    if (pendingPromotion && !isProcessingPromotion) {
      setIsProcessingPromotion(true);
      setPendingPromotion(null);
      onMove(pendingPromotion.from, pendingPromotion.to, piece);
      setTimeout(() => {
        setIsProcessingPromotion(false);
      }, 1000);
    }
  };

  const handleSquareClick = (square: SquareType) => {
    if (!boardState.selectedSquare) {
      const piece = getPieceAtSquare(square, boardState.optimisticBoard);
      if (piece && (piece === piece.toUpperCase() ? "white" : "black") === playerSide) {
        if (isSquareOnCooldown(square, playerId, pieceCooldowns)) {
          const cooldown = pieceCooldowns.find((pc) => pc.square === square);
          const remainingSeconds = cooldown
            ? Math.ceil((cooldown.availableAt.getTime() - Date.now()) / 1000)
            : 0;
          boardState.triggerWiggle(`Piece on cooldown for ${remainingSeconds}s`);
          return;
        }
        boardState.setSelectedSquare(square);
      } else {
        boardState.triggerWiggle("Select your own piece first");
      }
      return;
    }

    if (boardState.selectedSquare === square) {
      boardState.setSelectedSquare(null);
      return;
    }

    if (isPossibleMove(square)) {
      // Enhanced pre-validation: Check if player can make move (including pending moves)
      if (!boardState.canMakeMove(playerId)) {
        boardState.triggerMagazineError("No bullets available! Wait for reload...");
        return;
      }
      
      // Use enhanced optimistic move with validation
      const result = boardState.addOptimisticMoveWithValidation(boardState.selectedSquare, square);
      
      if (!result.success) {
        boardState.triggerMagazineError(result.error || "Cannot make move");
        return;
      }
      
      // Update local moves count optimistically
      boardState.setLocalMovesLeft(prev => Math.max(0, prev - 1));
      
      // Send move to server
      onMove(boardState.selectedSquare, square);
      boardState.setSelectedSquare(null);
      
      // Move completed successfully
    } else {
      const piece = getPieceAtSquare(square, boardState.optimisticBoard);
      if (piece && (piece === piece.toUpperCase() ? "white" : "black") === playerSide) {
        if (isSquareOnCooldown(square, playerId, pieceCooldowns)) {
          const cooldown = pieceCooldowns.find((pc) => pc.square === square);
          const remainingSeconds = cooldown
            ? Math.ceil((cooldown.availableAt.getTime() - Date.now()) / 1000)
            : 0;
          boardState.triggerWiggle(`Piece on cooldown for ${remainingSeconds}s`);
          return;
        }
        boardState.setSelectedSquare(square);
      } else {
        boardState.setSelectedSquare(null);
      }
    }
  };

  const isPossibleMove = (square: SquareType): boolean => {
    return boardState.selectedSquare
      ? effectivePossibleMoves[boardState.selectedSquare]?.includes(square) || false
      : false;
  };

  const renderSquare = (row: number, col: number) => {
    const file = String.fromCharCode(97 + col);
    const rank = 8 - row;
    const square = `${file}${rank}` as SquareType;
    const piece = getPieceAtSquare(square, boardState.optimisticBoard);
    const isLight = (row + col) % 2 === 0;
    const isSelected = boardState.selectedSquare === square;
    const cooldowns = getCooldownsForSquare(square, pieceCooldowns);
    const isPlayerPiece = Boolean(
      piece && (piece === piece.toUpperCase() ? "white" : "black") === playerSide
    );
    const isPossibleTarget = isPossibleMove(square);
    
    const lastMove = gameState.moveHistory[gameState.moveHistory.length - 1];
    const isLastMoveFrom = lastMove ? lastMove.from === square : false;
    
    const currentMovesLeft = boardState.getPlayerMovesLeft(playerId);
    const canMakeMove = currentMovesLeft > 0;
    
    const nextMoveAvailableAt = boardState.playerBulletReloadTimes.length > 0 
      ? boardState.playerBulletReloadTimes.sort((a, b) => a.getTime() - b.getTime())[0]
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
    const isPendingMove = boardState.pendingMoves.some(move => move.from === square || move.to === square);
    
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
            {boardState.errorMessage && (
              <p className="text-xs text-red-500 animate-pulse">{boardState.errorMessage}</p>
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
            {onSurrender && !isSpectator && gameState.status === 'playing' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSurrender}
                className="h-6 w-6 p-0 rounded-full bg-red-600/10 hover:bg-red-600/20 border border-red-600/20 shadow-sm"
              >
                <span className="text-red-600 text-xs">⚐</span>
              </Button>
            )}
          </div>
        </div>

        {/* Opponent bullets at top */}
        {boardState.opponent && (
          <div className="flex justify-center items-center py-1 px-2 bg-background border-b">
            <BulletCounter
              movesLeft={boardState.opponentMovesLeft}
              maxMoves={boardState.maxMoves}
              isReloading={boardState.isOpponentReloading}
              isOpponent={true}
              playerName={boardState.opponent.name || "Opponent"}
              bulletReloadTimes={boardState.opponentBulletReloadTimes}
              cooldownSeconds={10}
            />
          </div>
        )}

        <div className="p-1">
          <div className="aspect-square w-full max-w-none">
            <div className={`relative ${boardState.errorMessage ? (playerSide === "black" ? "animate-wiggle-black" : "animate-wiggle") : ""}`}>
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
            movesLeft={boardState.localMovesLeft}
            maxMoves={boardState.maxMoves}
            isReloading={boardState.isReloading}
            isOpponent={false}
            playerName={gameState.players.find(p => p.id === playerId)?.name || "You"}
            bulletReloadTimes={boardState.playerBulletReloadTimes}
            cooldownSeconds={10}
            magazineError={boardState.magazineError}
            magazineErrorKey={boardState.magazineErrorKey}
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
              {onSurrender && !isSpectator && gameState.status === 'playing' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onSurrender}
                  className="h-8 w-8 p-0 rounded-full bg-red-600/10 hover:bg-red-600/20 border border-red-600/20 shadow-sm"
                >
                  <span className="text-red-600 text-xs">⚐</span>
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-1 items-center">
            {/* Left side: Player bullets */}
            <div className="flex flex-row sm:flex-col gap-1 sm:gap-2 min-w-[80px] sm:min-w-[80px] justify-center">
              <BulletCounter
                movesLeft={boardState.localMovesLeft}
                maxMoves={boardState.maxMoves}
                isReloading={boardState.isReloading}
                isOpponent={false}
                playerName={gameState.players.find(p => p.id === playerId)?.name || "You"}
                bulletReloadTimes={boardState.playerBulletReloadTimes}
                cooldownSeconds={10}
                magazineError={boardState.magazineError}
                magazineErrorKey={boardState.magazineErrorKey}
              />
            </div>

            {/* Board section */}
            <div className="flex-1 w-full">
              <div className="aspect-square max-w-xs sm:max-w-2xl mx-auto">
                <div className={`relative ${boardState.errorMessage ? (playerSide === "black" ? "animate-wiggle-black" : "animate-wiggle") : ""}`}>
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
              {boardState.opponent ? (
                <BulletCounter
                  movesLeft={boardState.opponentMovesLeft}
                  maxMoves={boardState.maxMoves}
                  isReloading={boardState.isOpponentReloading}
                  isOpponent={true}
                  playerName={boardState.opponent.name || "Opponent"}
                  bulletReloadTimes={boardState.opponentBulletReloadTimes}
                  cooldownSeconds={10}
                />
              ) : (
                <div className="min-w-[80px]"></div>
              )}
            </div>
          </div>

          <div className="mt-0.5 text-center space-y-0.5">
            {boardState.errorMessage && (
              <p className="text-xs text-red-500 animate-pulse">{boardState.errorMessage}</p>
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
          isProcessing={isProcessingPromotion}
        />
      )}
    </>
  );
}
