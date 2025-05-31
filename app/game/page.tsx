"use client";

import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { LogOut, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConnectionStatus } from "@/components/game/ConnectionStatus";
import { SpectatorInfo } from "@/components/game/SpectatorInfo";
import { WaitingRoom } from "@/components/game/WaitingRoom";
import { GameSettings } from "@/components/game/GameSettings";
import { GameStarted } from "@/components/game/GameStarted";
import { useSocket } from "@/lib/hooks/useSocket";
import { GameSettings as GameSettingsType } from "@/app/models/Game";
import { Square } from "chess.js";

function GamePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const gameId = searchParams.get("id");
  const [shareableLink, setShareableLink] = useState("");

  const {
    isConnected,
    gameState,
    playerId,
    isSpectator,
    possibleMoves,
    pieceCooldowns,
    movesLeft,
    joinGame,
    leaveGame,
    switchSides,
    startGame,
    setGameSettings,
    makeMove,
    requestPossibleMoves,
  } = useSocket();

  useEffect(() => {
    if (!gameId) {
      router.push("/");
      return;
    }

    // Create shareable link
    const link = `${window.location.origin}/game?id=${gameId}`;
    setShareableLink(link);

    // Join the game when connected
    if (isConnected) {
      joinGame(gameId);
    }
  }, [gameId, router, isConnected, joinGame]);

  const handleExit = () => {
    leaveGame();
    router.push("/");
  };

  const handleSettingsSubmit = (settings: GameSettingsType) => {
    setGameSettings(settings);
  };

  const handleMove = (from: string, to: string) => {
    makeMove(from as Square, to as Square);
  };

  if (!gameId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-2">
        <Card className="rounded-lg sm:rounded-2xl">
          <CardContent className="p-3 sm:p-6">
            <p className="text-destructive text-sm">Invalid game ID</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-1 sm:p-4">
      <div className="max-w-4xl mx-auto space-y-1.5 sm:space-y-6">
        {/* Header - more compact on mobile */}
        <div className="flex justify-between items-center bg-card rounded-lg sm:rounded-2xl p-1.5 sm:p-4 border">
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="text-sm sm:text-2xl">♟️</span>
            <div>
              <div className="flex items-center gap-1 sm:gap-2">
                <h1 className="text-xs sm:text-lg font-bold">
                  <span className="sm:hidden">Chess</span>
                  <span className="hidden sm:inline">Rapid Chess</span>
                </h1>
                {isSpectator && (
                  <Badge
                    variant="secondary"
                    className="text-xs rounded-sm sm:rounded-md animate-pulse px-0.5 sm:px-1 py-0"
                  >
                    <Eye className="h-1.5 w-1.5 sm:h-2.5 sm:w-2.5 mr-0.5" />
                    <span className="sm:hidden">👁</span>
                    <span className="hidden sm:inline">Spectator</span>
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <ConnectionStatus isConnected={isConnected} gameId={gameId} />
                {gameState && (
                  <SpectatorInfo
                    spectatorCount={gameState.spectators?.length || 0}
                  />
                )}
              </div>
            </div>
          </div>
          <Button
            onClick={handleExit}
            variant="destructive"
            size="sm"
            className="rounded-md sm:rounded-xl h-6 sm:h-8 px-1.5 sm:px-3"
          >
            <LogOut className="h-2.5 w-2.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline ml-1">Exit</span>
          </Button>
        </div>

        {/* Loading states - more compact */}
        {!gameState && isConnected && (
          <Card className="rounded-lg sm:rounded-2xl animate-pulse">
            <CardContent className="p-2 sm:p-6 text-center">
              <div className="animate-spin rounded-full h-2.5 w-2.5 sm:h-6 sm:w-6 border-b-2 border-primary mx-auto mb-1 sm:mb-2"></div>
              <p className="text-muted-foreground text-xs sm:text-sm">
                Joining...
              </p>
            </CardContent>
          </Card>
        )}

        {!isConnected && (
          <Card className="border-destructive/50 rounded-lg sm:rounded-2xl animate-pulse">
            <CardContent className="p-2 sm:p-6 text-center">
              <div className="animate-spin rounded-full h-2.5 w-2.5 sm:h-6 sm:w-6 border-b-2 border-destructive mx-auto mb-1 sm:mb-2"></div>
              <p className="text-destructive text-xs sm:text-sm">
                Connecting...
              </p>
            </CardContent>
          </Card>
        )}

        {/* Game states */}
        {gameState?.status === "waiting" && (
          <WaitingRoom
            gameState={gameState}
            playerId={playerId}
            shareableLink={shareableLink}
            isSpectator={isSpectator}
          />
        )}

        {gameState?.status === "settings" && (
          <GameSettings
            gameState={gameState}
            playerId={playerId}
            shareableLink={shareableLink}
            onSwitchSides={switchSides}
            onReady={startGame}
            onSettingsSubmit={handleSettingsSubmit}
            isSpectator={isSpectator}
          />
        )}

        {gameState?.status === "playing" && (
          <GameStarted
            gameState={gameState}
            playerId={playerId}
            gameId={gameId}
            isConnected={isConnected}
            isSpectator={isSpectator}
            possibleMoves={possibleMoves}
            pieceCooldowns={pieceCooldowns}
            movesLeft={movesLeft}
            onMove={handleMove}
            onRequestPossibleMoves={requestPossibleMoves}
          />
        )}
      </div>
    </div>
  );
}

export default function GamePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background p-2">
          <Card className="rounded-lg sm:rounded-2xl animate-pulse">
            <CardContent className="p-3 sm:p-6 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-muted-foreground text-sm">Loading...</p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <GamePageContent />
    </Suspense>
  );
}
