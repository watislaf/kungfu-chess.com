"use client";

import { Square as SquareType } from "chess.js";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { GameState, PieceCooldown } from "@/app/models/Game";
import { Square as SquareComponent } from "./Square";
import PieceSVG from "./PieceSVG";
import { CooldownOverlay } from "./CooldownOverlay";
import { BulletCounter } from "./BulletCounter";
import { PawnPromotion } from "./PawnPromotion";
import { MoveIndicator } from "./MoveIndicator";
import { CaptureEffect } from "./CaptureEffect";

interface ChessBoardProps {
  gameState: GameState & { board: (any[] | null)[] };
  playerId: string;
  playerSide: "white" | "black";
  onMove: (from: SquareType, to: SquareType, promotion?: string) => void;
  possibleMoves: { [square: string]: string[] };
  pieceCooldowns: PieceCooldown[];
  movesLeft: number;
}

export function ChessBoard({
  gameState,
  playerId,
  playerSide,
  onMove,
  possibleMoves,
  pieceCooldowns,
  movesLeft,
}: ChessBoardProps) {
  const [selectedSquare, setSelectedSquare] = useState<SquareType | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [wiggleKey, setWiggleKey] = useState(0);
  const [prevMovesLeft, setPrevMovesLeft] = useState(movesLeft);
  const [isReloading, setIsReloading] = useState(false);
  const [localMovesLeft, setLocalMovesLeft] = useState(movesLeft);
  const [prevOpponentMoves, setPrevOpponentMoves] = useState(0);
  const [isOpponentReloading, setIsOpponentReloading] = useState(false);
  const [playerBulletReloadTimes, setPlayerBulletReloadTimes] = useState<Date[]>([]);
  const [opponentBulletReloadTimes, setOpponentBulletReloadTimes] = useState<Date[]>([]);
  const [pendingPromotion, setPendingPromotion] = useState<{from: SquareType, to: SquareType} | null>(null);
  const [isProcessingPromotion, setIsProcessingPromotion] = useState(false);
  const [magazineError, setMagazineError] = useState<string | null>(null);
  const [magazineErrorKey, setMagazineErrorKey] = useState(0);
  const [lastMoveIndicator, setLastMoveIndicator] = useState<{from: SquareType, to: SquareType} | null>(null);
  const [captureEffect, setCaptureEffect] = useState<{square: SquareType, timestamp: number} | null>(null);

  // Get opponent info and calculate constants first
  const opponent = gameState.players.find(p => p.id !== playerId);
  const maxMoves = gameState.settings?.maxMovesPerPeriod || 3;

  useEffect(() => {
    setSelectedSquare(null);
  }, [gameState.fen]);

  // Update local moves when prop changes
  useEffect(() => {
    setLocalMovesLeft(movesLeft);
  }, [movesLeft]);

  // Track last move for visual indication
  useEffect(() => {
    const lastMove = gameState.moveHistory[gameState.moveHistory.length - 1];
    if (lastMove) {
      console.log('🎯 New move detected:', lastMove);
      setLastMoveIndicator({ from: lastMove.from, to: lastMove.to });
      
      // Check if this move was a capture
      if (lastMove.captured) {
        console.log('💥 Capture detected! Starting particle effect on square:', lastMove.to);
        setCaptureEffect({ square: lastMove.to, timestamp: Date.now() });
        // Clear capture effect after animation (matches CaptureEffect duration)
        setTimeout(() => setCaptureEffect(null), 1500);
      }
      
      // Clear move indicator after showing it longer for better visibility
      setTimeout(() => setLastMoveIndicator(null), 4000);
    }
  }, [gameState.moveHistory]);

  // Clear capture effect when it expires
  useEffect(() => {
    if (captureEffect) {
      const timeLeft = 1500 - (Date.now() - captureEffect.timestamp);
      if (timeLeft > 0) {
        const timer = setTimeout(() => setCaptureEffect(null), timeLeft);
        return () => clearTimeout(timer);
      } else {
        setCaptureEffect(null);
      }
    }
  }, [captureEffect]);

  // Detect reloading when moves increase
  useEffect(() => {
    if (movesLeft > prevMovesLeft) {
      setIsReloading(true);
      setTimeout(() => setIsReloading(false), 1000);
    }
    setPrevMovesLeft(movesLeft);
  }, [movesLeft, prevMovesLeft]);

  // Helper to calculate moves left for a player based on individual bullet reload times
  const getPlayerMovesLeft = (pId: string): number => {
    if (!gameState.settings) return 0;
    
    const now = Date.now();
    // Use 10 seconds to match server logic, not pieceCooldownSeconds
    const rateLimitMs = 10000; // Match server's 10-second window
    
    // Get recent moves for this player within the rate limit window
    const recentMoves = gameState.playerMoveHistory
      .filter(move => move.playerId === pId)
      .filter(move => {
        // Handle both Date objects and timestamps
        const timestamp = move.timestamp instanceof Date ? move.timestamp.getTime() : new Date(move.timestamp).getTime();
        return (now - timestamp) < rateLimitMs; // Use rate limit window, not cooldown
      }) // Only moves still within rate limit
      .sort((a, b) => {
        // Handle both Date objects and timestamps for sorting
        const aTime = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime();
        const bTime = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime();
        return bTime - aTime;
      }) // Most recent first
      .slice(0, maxMoves); // Limit to max bullets
    
    return Math.max(0, maxMoves - recentMoves.length);
  };
  
  const opponentMovesLeft = opponent ? getPlayerMovesLeft(opponent.id) : 0;

  // Detect opponent reloading
  useEffect(() => {
    if (opponentMovesLeft > prevOpponentMoves) {
      setIsOpponentReloading(true);
      setTimeout(() => setIsOpponentReloading(false), 1000);
    }
    setPrevOpponentMoves(opponentMovesLeft);
  }, [opponentMovesLeft, prevOpponentMoves]);

  // Initialize bullet reload times based on move history
  useEffect(() => {
    if (!gameState.settings) return;
    
    // Use 10-second rate limit window for bullet reloading, not piece cooldown
    const rateLimitMs = 10000; // Match server's 10-second window
    const now = Date.now();
    
    // Calculate reload times for player based on actual server timestamps
    const playerMoves = gameState.playerMoveHistory
      .filter(move => move.playerId === playerId)
      .map(move => {
        // Handle both Date objects and timestamps
        const timestamp = move.timestamp instanceof Date ? move.timestamp.getTime() : new Date(move.timestamp).getTime();
        return {
          timestamp: timestamp,
          reloadTime: new Date(timestamp + rateLimitMs) // Use rate limit window
        };
      })
      .filter(move => move.reloadTime.getTime() > now) // Only moves still reloading
      .sort((a, b) => b.timestamp - a.timestamp) // Most recent first
      .slice(0, maxMoves) // Limit to max bullets
      .map(move => move.reloadTime);
    
    setPlayerBulletReloadTimes(playerMoves);
    
    // Calculate reload times for opponent based on actual server timestamps
    if (opponent) {
      const opponentMoves = gameState.playerMoveHistory
        .filter(move => move.playerId === opponent.id)
        .map(move => {
          // Handle both Date objects and timestamps
          const timestamp = move.timestamp instanceof Date ? move.timestamp.getTime() : new Date(move.timestamp).getTime();
          return {
            timestamp: timestamp,
            reloadTime: new Date(timestamp + rateLimitMs) // Use rate limit window
          };
        })
        .filter(move => move.reloadTime.getTime() > now) // Only moves still reloading
        .sort((a, b) => b.timestamp - a.timestamp) // Most recent first
        .slice(0, maxMoves) // Limit to max bullets
        .map(move => move.reloadTime);
      
      setOpponentBulletReloadTimes(opponentMoves);
    }
  }, [gameState.playerMoveHistory, gameState.settings, playerId, opponent, maxMoves]);

  // Check for pending promotion from game state
  useEffect(() => {
    // Handle promotion dialog showing - only if not currently processing a selection
    if (gameState.pendingPromotion && 
        gameState.pendingPromotion.playerId === playerId && 
        !pendingPromotion &&
        !isProcessingPromotion) {
      console.log('Setting pending promotion:', gameState.pendingPromotion);
      setPendingPromotion({
        from: gameState.pendingPromotion.from,
        to: gameState.pendingPromotion.to
      });
    }
    
    // Handle promotion dialog hiding - only when server clears it AND we're not processing
    if (!gameState.pendingPromotion && pendingPromotion && !isProcessingPromotion) {
      console.log('Server cleared promotion, hiding dialog');
      setPendingPromotion(null);
      setIsProcessingPromotion(false);
    }
  }, [gameState.pendingPromotion, playerId, pendingPromotion, isProcessingPromotion]);

  const handlePromotionSelect = (piece: string) => {
    if (pendingPromotion && !isProcessingPromotion) {
      console.log('Handling promotion select:', piece);
      setIsProcessingPromotion(true);
      
      // Immediately close the dialog and clear local state
      setPendingPromotion(null);
      
      // Make the move with promotion
      onMove(pendingPromotion.from, pendingPromotion.to, piece);
      
      // Reset processing flag after a short delay
      setTimeout(() => {
        setIsProcessingPromotion(false);
      }, 1000);
    }
  };

  const handleSquareClick = (square: SquareType) => {
    if (!selectedSquare) {
      const piece = getPieceAtSquare(square);
      if (
        piece &&
        (piece === piece.toUpperCase() ? "white" : "black") === playerSide
      ) {
        if (isSquareOnCooldown(square)) {
          const cooldown = pieceCooldowns.find((pc) => pc.square === square);
          const remainingSeconds = cooldown
            ? Math.ceil((cooldown.availableAt.getTime() - Date.now()) / 1000)
            : 0;
          triggerWiggle(`Piece on cooldown for ${remainingSeconds}s`);
          return;
        }
        setSelectedSquare(square);
        setErrorMessage(null);
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
      // Check if player has bullets before making move
      const currentMovesLeft = getPlayerMovesLeft(playerId);
      if (currentMovesLeft <= 0) {
        triggerMagazineError("No bullets available! Wait for reload...");
        return;
      }
      
      // Immediately decrease local move count for instant feedback
      setLocalMovesLeft(prev => Math.max(0, prev - 1));
      
      // Don't add immediate bullet reload time - let server timing handle it
      // The useEffect will update bullet times based on actual server move history
      
      onMove(selectedSquare, square);
      setSelectedSquare(null);
    } else {
      // Check if the clicked square has a piece of the current player
      const piece = getPieceAtSquare(square);
      if (
        piece &&
        (piece === piece.toUpperCase() ? "white" : "black") === playerSide
      ) {
        // If clicking on own piece, select it (switch selection)
        if (isSquareOnCooldown(square)) {
          const cooldown = pieceCooldowns.find((pc) => pc.square === square);
          const remainingSeconds = cooldown
            ? Math.ceil((cooldown.availableAt.getTime() - Date.now()) / 1000)
            : 0;
          triggerWiggle(`Piece on cooldown for ${remainingSeconds}s`);
          return;
        }
        setSelectedSquare(square);
        setErrorMessage(null);
      } else {
        // If clicking on invalid target or empty square, just deselect silently
        setSelectedSquare(null);
        setErrorMessage(null);
      }
    }
  };

  const triggerWiggle = (message: string) => {
    setErrorMessage(message);
    setWiggleKey((prev) => prev + 1);
    setTimeout(() => setErrorMessage(null), 2000);
  };

  const triggerMagazineError = (message: string) => {
    setMagazineError(message);
    setMagazineErrorKey((prev) => prev + 1);
    setTimeout(() => setMagazineError(null), 2500);
  };

  const getSquareIndex = (square: SquareType): number => {
    const file = square.charCodeAt(0) - 97;
    const rank = 8 - parseInt(square[1]);
    return rank * 8 + file;
  };

  const getPieceAtSquare = (square: SquareType): string | null => {
    if (!gameState.board) return null;
    const file = square.charCodeAt(0) - 97;
    const rank = 8 - parseInt(square[1]);
    const piece = gameState.board[rank]?.[file];
    if (!piece) return null;
    const pieceChar = (() => {
      switch (piece.type) {
        case "p":
          return piece.color === "w" ? "P" : "p";
        case "n":
          return piece.color === "w" ? "N" : "n";
        case "b":
          return piece.color === "w" ? "B" : "b";
        case "r":
          return piece.color === "w" ? "R" : "r";
        case "q":
          return piece.color === "w" ? "Q" : "q";
        case "k":
          return piece.color === "w" ? "K" : "k";
        default:
          return null;
      }
    })();
    return pieceChar;
  };

  const isSquareOnCooldown = (square: SquareType): boolean => {
    const now = Date.now();
    return pieceCooldowns.some(
      (pc) =>
        pc.square === square &&
        pc.playerId === playerId &&
        pc.availableAt.getTime() > now
    );
  };

  const getCooldownsForSquare = (square: SquareType) => {
    const now = Date.now();
    const activeCooldowns = pieceCooldowns.filter(
      (pc) => pc.square === square && pc.availableAt.getTime() > now
    );
    
    // Return only the most recent cooldown (the one with the latest availableAt time)
    if (activeCooldowns.length === 0) return [];
    
    const mostRecentCooldown = activeCooldowns.reduce((latest, current) => 
      current.availableAt.getTime() > latest.availableAt.getTime() ? current : latest
    );
    
    return [mostRecentCooldown];
  };

  const isPossibleMove = (square: SquareType): boolean => {
    return selectedSquare
      ? possibleMoves[selectedSquare]?.includes(square) || false
      : false;
  };

  const renderSquare = (row: number, col: number) => {
    const file = String.fromCharCode(97 + col);
    const rank = 8 - row;
    const square = `${file}${rank}` as SquareType;
    const piece = getPieceAtSquare(square);
    const isLight = (row + col) % 2 === 0;
    const isSelected = selectedSquare === square;
    const cooldowns = getCooldownsForSquare(square);
    const isPlayerPiece = Boolean(
      piece &&
        (piece === piece.toUpperCase() ? "white" : "black") === playerSide
    );
    const isPossibleTarget = isPossibleMove(square);
    
    // Check if this square is where the last move came from (for square highlighting)
    const lastMove = gameState.moveHistory[gameState.moveHistory.length - 1];
    const isLastMoveFrom = lastMove ? lastMove.from === square : false;
    
    // Calculate move availability
    const currentMovesLeft = getPlayerMovesLeft(playerId);
    const canMakeMove = currentMovesLeft > 0;
    
    // Calculate when next bullet will be available
    const nextMoveAvailableAt = playerBulletReloadTimes.length > 0 
      ? playerBulletReloadTimes.sort((a, b) => a.getTime() - b.getTime())[0]
      : undefined;
    
    return (
      <SquareComponent
        key={`${row}-${col}`}
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
        onClick={handleSquareClick}
      />
    );
  };

  const getNextResetTime = (): number => {
    if (!gameState.settings) return 0;
    const now = Date.now();
    const periodMs = 10000;
    const nextReset = Math.ceil(now / periodMs) * periodMs;
    return Math.max(0, Math.ceil((nextReset - now) / 1000));
  };

  return (
    <>
      <Card className="rounded-xl sm:rounded-2xl">
        <CardHeader className="pb-2 sm:pb-4 px-3 sm:px-6 pt-3 sm:pt-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs sm:text-xl">
              <span className="sm:hidden">Board</span>
              <span className="hidden sm:inline">Chess Board</span>
            </CardTitle>
            <Badge
              variant={playerSide === "white" ? "default" : "secondary"}
              className="text-xs rounded-md px-1 py-0"
            >
              <span className="sm:hidden">
                {playerSide === "white" ? "♔" : "♚"}
              </span>
              <span className="hidden sm:inline">
                Playing as {playerSide === "white" ? "♔ White" : "♚ Black"}
              </span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-2 sm:p-6">
          {/* Main game area with bullet counters on both sides */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            {/* Left Side Bullet Counter - Player */}
            <div className="flex flex-row sm:flex-col gap-4 sm:gap-6 min-w-[80px] sm:min-w-[80px] justify-center">
              <BulletCounter
                movesLeft={localMovesLeft}
                maxMoves={maxMoves}
                isReloading={isReloading}
                isOpponent={false}
                playerName="You"
                bulletReloadTimes={playerBulletReloadTimes}
                cooldownSeconds={10}
                magazineError={magazineError}
                magazineErrorKey={magazineErrorKey}
              />
            </div>

            {/* Chess Board */}
            <div className="flex-1 w-full">
              <div className="aspect-square max-w-xs sm:max-w-2xl mx-auto">
                {/* Wiggle container - separate from rotation */}
                <div className={`relative ${errorMessage ? (playerSide === "black" ? "animate-wiggle-black" : "animate-wiggle") : ""}`}>
                  {/* Board rotation container */}
                  <div
                    className={`grid grid-cols-8 gap-0 border border-muted sm:border-2 rounded-lg sm:rounded-2xl overflow-hidden shadow-sm sm:shadow-lg ${
                      playerSide === "black" ? "rotate-180" : ""
                    }`}
                  >
                    {Array.from({ length: 8 }).map((_, row) =>
                      Array.from({ length: 8 }).map((_, col) => {
                        const squareElement = renderSquare(row, col);
                        // Rotate individual squares back when board is rotated for black
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
                  
                  {/* Move Indicator Overlay */}
                  {lastMoveIndicator && (
                    <div className="absolute inset-0 pointer-events-none">
                      <MoveIndicator 
                        from={lastMoveIndicator.from} 
                        to={lastMoveIndicator.to}
                        playerSide={playerSide}
                      />
                    </div>
                  )}
                  
                  {/* Capture Effect Overlay */}
                  {captureEffect && (
                    <div className="absolute inset-0 pointer-events-none">
                      <CaptureEffect 
                        square={captureEffect.square}
                        playerSide={playerSide}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Side Bullet Counter - Opponent */}
            <div className="flex flex-row sm:flex-col gap-4 sm:gap-6 min-w-[80px] sm:min-w-[80px] justify-center">
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

          <div className="mt-2 sm:mt-4 text-center space-y-1">
            {errorMessage && (
              <p className="text-xs text-red-500 animate-pulse">{errorMessage}</p>
            )}

            <div className="flex justify-center gap-2 sm:gap-4 text-xs text-muted-foreground">
              {gameState.settings && (
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    {gameState.settings.pieceCooldownSeconds}s
                  </Badge>
                  <span className="sm:hidden">cooldown</span>
                  <span className="hidden sm:inline">piece cooldown</span>
                </div>
              )}
              
              <div className="flex items-center gap-1">
                <Badge variant="outline" className="text-xs px-1 py-0">
                  {getNextResetTime()}s
                </Badge>
                <span className="sm:hidden">reload</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Pawn Promotion Modal */}
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
