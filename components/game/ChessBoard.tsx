"use client";

import { Square as SquareType } from "chess.js";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { GameState, PieceCooldown } from "@/app/models/Game";
import { Square as SquareComponent } from "./Square";
import PieceSVG from "./PieceSVG";
import { CooldownOverlay } from "./CooldownOverlay";

interface ChessBoardProps {
  gameState: GameState & { board: (any[] | null)[] };
  playerId: string;
  playerSide: "white" | "black";
  onMove: (from: SquareType, to: SquareType) => void;
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

  useEffect(() => {
    setSelectedSquare(null);
  }, [gameState.fen]);

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
      onMove(selectedSquare, square);
      setSelectedSquare(null);
    } else {
      triggerWiggle("Invalid move");
    }
  };

  const triggerWiggle = (message: string) => {
    setErrorMessage(message);
    setWiggleKey((prev) => prev + 1);
    setTimeout(() => setErrorMessage(null), 2000);
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
    return pieceCooldowns.filter(
      (pc) => pc.square === square && pc.availableAt.getTime() > now
    );
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
        <div className="aspect-square max-w-xs sm:max-w-2xl mx-auto">
          <div
            key={wiggleKey}
            className={`grid grid-cols-8 gap-0 border border-muted sm:border-2 rounded-lg sm:rounded-2xl overflow-hidden shadow-sm sm:shadow-lg ${
              errorMessage ? "animate-wiggle" : ""
            }`}
          >
            {Array.from({ length: 8 }).map((_, row) =>
              Array.from({ length: 8 }).map((_, col) => renderSquare(row, col))
            )}
          </div>
        </div>

        <div className="mt-2 sm:mt-4 text-center space-y-1">
          {errorMessage && (
            <p className="text-xs text-red-500 animate-pulse">{errorMessage}</p>
          )}

          <div className="flex justify-center gap-2 sm:gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Badge
                variant={movesLeft > 0 ? "default" : "destructive"}
                className="text-xs px-1 py-0"
              >
                {movesLeft}
              </Badge>
              <span className="sm:hidden">moves left</span>
              <span className="hidden sm:inline">
                moves left (resets in {getNextResetTime()}s)
              </span>
            </div>

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
  );
}
