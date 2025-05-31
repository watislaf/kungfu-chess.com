"use client";

import { useEffect } from "react";
import { GameState, PieceCooldown } from "@/app/models/Game";
import { PlayerList } from "./PlayerList";
import { ChessBoard } from "./ChessBoard";
import { ConnectionStatus } from "./ConnectionStatus";

interface GameStartedProps {
  gameState: GameState;
  playerId: string;
  gameId: string;
  isConnected: boolean;
  isSpectator: boolean;
  possibleMoves: { [square: string]: string[] };
  pieceCooldowns: PieceCooldown[];
  movesLeft: number;
  onMove: (from: string, to: string) => void;
  onRequestPossibleMoves: () => void;
}

export function GameStarted({
  gameState,
  playerId,
  gameId,
  isConnected,
  isSpectator,
  possibleMoves,
  pieceCooldowns,
  movesLeft,
  onMove,
  onRequestPossibleMoves,
}: GameStartedProps) {
  const currentPlayer = gameState.players.find((p) => p.id === playerId);

  // Request possible moves when component mounts and periodically
  useEffect(() => {
    if (!isSpectator && isConnected) {
      onRequestPossibleMoves();

      // Update possible moves every 2 seconds to refresh cooldowns
      const interval = setInterval(() => {
        onRequestPossibleMoves();
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [isSpectator, isConnected, onRequestPossibleMoves]);

  return (
    <div className="space-y-2 sm:space-y-6 animate-in fade-in duration-500">
      <ChessBoard
        gameState={gameState}
        playerId={playerId}
        playerSide={currentPlayer?.side || "white"}
        onMove={onMove}
        possibleMoves={possibleMoves}
        pieceCooldowns={pieceCooldowns}
        movesLeft={movesLeft}
      />

      <div className="flex flex-col gap-2 sm:grid sm:gap-4 lg:grid-cols-2">
        <div className="space-y-1 sm:space-y-2">
          <h3 className="text-xs text-muted-foreground px-1">
            <span className="sm:hidden">Status</span>
            <span className="hidden sm:inline">Connection</span>
          </h3>
          <div className="p-1 sm:p-3 bg-card rounded-md sm:rounded-xl border">
            <ConnectionStatus isConnected={isConnected} gameId={gameId} />
          </div>
        </div>

        <div>
          <PlayerList
            gameState={gameState}
            playerId={playerId}
            showReadyStatus={false}
            isSpectator={isSpectator}
          />
        </div>
      </div>
    </div>
  );
}
