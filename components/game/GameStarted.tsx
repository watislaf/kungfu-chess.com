"use client";

import { useEffect } from "react";
import { GameState, PieceCooldown } from "@/app/models/Game";
import { PlayerList } from "./PlayerList";
import { ChessBoard } from "./ChessBoard";
import { ConnectionStatus } from "./ConnectionStatus";
import { EndGame } from "./EndGame";

interface GameStartedProps {
  gameState: GameState & { board: (any[] | null)[] };
  playerId: string;
  gameId: string;
  isConnected: boolean;
  isSpectator: boolean;
  possibleMoves: { [square: string]: string[] };
  pieceCooldowns: PieceCooldown[];
  movesLeft: number;
  onMove: (from: string, to: string, promotion?: string) => void;
  onRequestPossibleMoves: () => void;
  onMoveSuccess?: (moveId: string) => void;
  onMoveError?: (moveId: string, error: string) => void;
  onSurrender?: () => void;
  onRestartGame?: () => void;
  onBackToHome?: () => void;
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
  onMoveSuccess,
  onMoveError,
  onSurrender,
  onRestartGame,
  onBackToHome,
}: GameStartedProps) {
  const currentPlayer = gameState.players.find((p) => p.id === playerId);

  // Debug logging for player identification issues
  if (!currentPlayer && !isSpectator && playerId === 'player_unknown') {
    console.error('🔍 [GameStarted] Critical: Player ID is unknown, suggesting a connection issue:', {
      playerId,
      gameStatePlayers: gameState.players.map(p => ({ id: p.id, name: p.name, side: p.side })),
      isSpectator,
      isConnected,
      gameId,
      suggestion: 'Try refreshing the page or rejoining the game'
    });
  } else if (!currentPlayer && !isSpectator) {
    console.warn('🔍 [GameStarted] Player not found in game state:', {
      playerId,
      gameStatePlayers: gameState.players.map(p => ({ id: p.id, name: p.name, side: p.side })),
      isSpectator
    });
  }
  
  // Determine player side more defensively
  let playerSide: "white" | "black" = "white";
  if (currentPlayer?.side) {
    playerSide = currentPlayer.side;
  } else if (!isSpectator && gameState.players.length > 0) {
    // Fallback: if we can't find the current player, try to infer from the game state
    // This should rarely happen but provides a safety net
    console.warn('🔄 [GameStarted] Falling back to side inference');
    
    // If there's only one player and it's not us, we might be the second player (black)
    if (gameState.players.length === 1 && gameState.players[0].id !== playerId) {
      playerSide = "black";
    }
    // If there are two players, check if we can find ourselves by name match or other heuristics
    else if (gameState.players.length === 2) {
      // As a last resort, assume we're black if we're not the first player
      const firstPlayer = gameState.players[0];
      if (firstPlayer.id !== playerId) {
        playerSide = "black";
      }
    }
  }

  // If player is 'player_unknown', show a helpful error message
  if (playerId === 'player_unknown' && !isSpectator) {
    return (
      <div className="space-y-2 sm:space-y-6 animate-in fade-in duration-500">
        <div className="bg-red-900/20 border border-red-900/50 rounded-lg p-4 text-center">
          <h3 className="text-red-400 font-bold mb-2">Connection Issue Detected</h3>
          <p className="text-red-300 text-sm mb-4">
            Unable to identify your player in this game. This usually indicates a connection problem.
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium"
            >
              Refresh Page
            </button>
            <button
              onClick={onBackToHome}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm font-medium"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

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
        playerSide={playerSide}
        onMove={onMove}
        possibleMoves={possibleMoves}
        pieceCooldowns={pieceCooldowns}
        movesLeft={movesLeft}
        onMoveSuccess={onMoveSuccess}
        onMoveError={onMoveError}
        onSurrender={onSurrender}
        isSpectator={isSpectator}
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
      
      {/* End Game Modal */}
      {gameState.status === 'finished' && (
        <EndGame
          gameState={gameState}
          playerId={playerId}
          onRestartGame={onRestartGame}
          onBackToHome={onBackToHome}
        />
      )}
    </div>
  );
}
