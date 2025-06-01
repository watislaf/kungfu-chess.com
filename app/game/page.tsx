"use client";

import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { LogOut, Eye, Github, LogIn, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConnectionStatus } from "@/components/game/ConnectionStatus";
import { SpectatorInfo } from "@/components/game/SpectatorInfo";
import { WaitingRoom } from "@/components/game/WaitingRoom";
import { GameSettings } from "@/components/game/GameSettings";
import { GameStarted } from "@/components/game/GameStarted";
import { TipModal } from "@/components/ui/TipModal";
import { useSocket } from "@/lib/hooks/useSocket";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTipPrompt } from "@/lib/hooks/useTipPrompt";
import { GameSettings as GameSettingsType } from "@/app/models/Game";
import { Square } from "chess.js";

function GamePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Get game ID from either search params or URL hash (for backward compatibility)
  const searchParamGameId = searchParams.get("id");
  const [hashGameId, setHashGameId] = useState<string | null>(null);
  const [pendingMoves, setPendingMoves] = useState<Map<string, string>>(new Map()); // moveKey -> moveId
  const [lastGameStatus, setLastGameStatus] = useState<string | null>(null);

  const {
    isConnected,
    gameState,
    playerId,
    isSpectator,
    possibleMoves,
    pieceCooldowns,
    movesLeft,
    isMatchmaking,
    joinGame,
    leaveGame,
    switchSides,
    startGame,
    setGameSettings,
    makeMove,
    requestPossibleMoves,
    findRandomPlayer,
    cancelMatchmaking,
    restartGame,
    socket,
  } = useSocket();

  const auth = useAuth({ socket });

  const tipPrompt = useTipPrompt();

  useEffect(() => {
    // Extract game ID from URL hash for backward compatibility
    const extractGameId = () => {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#')) {
        return hash.substring(1);
      }
      return null;
    };

    const id = extractGameId();
    setHashGameId(id);

    // Listen for hash changes
    const handleHashChange = () => {
      const newId = extractGameId();
      setHashGameId(newId);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Use search params first, then fall back to hash
  const gameId = searchParamGameId || hashGameId;
  const [shareableLink, setShareableLink] = useState("");

  // Track game completion for tip prompting
  useEffect(() => {
    if (gameState?.status === 'finished' && lastGameStatus !== 'finished') {
      // Game just finished - could trigger chat prompt logic here if needed
    }
    setLastGameStatus(gameState?.status || null);
  }, [gameState?.status, lastGameStatus]);

  useEffect(() => {
    if (!gameId) {
      return;
    }

    // Create shareable link using search params format for consistency
    const link = `${window.location.origin}/game?id=${gameId}`;
    setShareableLink(link);

    // Join the game when connected
    if (isConnected) {
      joinGame(gameId);
    }
  }, [gameId, isConnected, joinGame]);

  // Auto-match functionality - trigger find random player when autoMatch=true
  useEffect(() => {
    const autoMatch = searchParams.get("autoMatch");
    
    if (autoMatch === "true" && 
        gameState?.status === "waiting" && 
        gameState?.players.length === 1 &&
        isConnected && 
        !isSpectator && 
        !isMatchmaking) {
      
      // Find the current player to get their name
      const currentPlayer = gameState.players.find(p => p.id === playerId);
      const playerName = currentPlayer?.name;
      
      // Automatically trigger find random player
      console.log('Auto-triggering find random player for:', playerName);
      findRandomPlayer(playerName);
      
      // Clean up the URL parameter to avoid re-triggering
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("autoMatch");
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [searchParams, gameState, isConnected, isSpectator, isMatchmaking, playerId, findRandomPlayer]);

  const handleSettingsSubmit = (settings: GameSettingsType) => {
    setGameSettings(settings);
  };

  const handleMove = (from: string, to: string, promotion?: string) => {
    const moveKey = `${from}-${to}-${promotion || ''}`;
    
    // Store the pending move to track success/failure
    setPendingMoves(prev => {
      const newMap = new Map(prev);
      // We'll get the moveId from the ChessBoard component
      newMap.set(moveKey, 'pending');
      return newMap;
    });
    
    makeMove(from as Square, to as Square, promotion);
  };

  const handleMoveSuccess = (moveId: string) => {
    // Remove from pending moves on success
    setPendingMoves(prev => {
      const newMap = new Map(prev);
      for (const [key, id] of newMap.entries()) {
        if (id === moveId) {
          newMap.delete(key);
          break;
        }
      }
      return newMap;
    });
  };

  const handleMoveError = (moveId: string, error: string) => {
    // Remove from pending moves and show error
    setPendingMoves(prev => {
      const newMap = new Map(prev);
      for (const [key, id] of newMap.entries()) {
        if (id === moveId) {
          newMap.delete(key);
          break;
        }
      }
      return newMap;
    });
    
    // Show error message to user
    console.error('Move failed:', error);
    
    // Request fresh board state from server to ensure consistency
    setTimeout(() => {
      requestPossibleMoves();
    }, 100);
  };

  const handleSurrender = () => {
    if (socket && gameState?.status === 'playing') {
      socket.emit('surrender');
    }
  };

  const openGitHubRepo = () => {
    // Open GitHub repository (replace with actual repo URL when available)
    window.open('https://github.com/your-username/rapid-chess-online', '_blank');
  };

  const handleLoginRedirect = () => {
    // Redirect to main page for login
    router.push('/');
  };

  const handleBackToHome = () => {
    // Navigate back to the main page
    router.push('/');
  };

  if (!gameId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-2">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            No game ID found. Please join a game from the home page.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background sm:p-4">
      {/* Fixed buttons - positioned absolutely in bottom right */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={openGitHubRepo}
            className="bg-gray-800/80 border-gray-700 text-gray-300 hover:bg-gray-700/80 backdrop-blur-sm"
          >
            <Github className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
            <span className="hidden sm:inline">View Source</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={tipPrompt.openPrompt}
            className="bg-red-900/20 border-red-900/50 text-red-400 hover:bg-red-900/40 backdrop-blur-sm"
          >
            <Heart className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
            <span className="hidden sm:inline">Tip</span>
          </Button>
        </div>
        {/* Login button for non-authenticated users */}
        {!auth.isAuthenticated && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoginRedirect}
            className="bg-blue-900/20 border-blue-900/50 text-blue-400 hover:bg-blue-900/40 backdrop-blur-sm w-full"
          >
            <LogIn className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
            <span className="hidden sm:inline">Login / Register</span>
            <span className="sm:hidden">Login</span>
          </Button>
        )}
      </div>

      {/* Mobile layout - no margins/padding, full screen usage */}
      <div className="sm:hidden">
        {/* Game states for mobile */}
        {gameState?.status === "waiting" && (
          <div className="p-2">
            <WaitingRoom
              gameState={gameState}
              playerId={playerId}
              shareableLink={shareableLink}
              isSpectator={isSpectator}
              isMatchmaking={isMatchmaking}
              onFindRandomPlayer={findRandomPlayer}
              onCancelMatchmaking={cancelMatchmaking}
            />
          </div>
        )}

        {gameState?.status === "settings" && (
          <div className="p-2">
            <GameSettings
              gameState={gameState}
              playerId={playerId}
              shareableLink={shareableLink}
              onSwitchSides={switchSides}
              onReady={startGame}
              onSettingsSubmit={handleSettingsSubmit}
              isSpectator={isSpectator}
            />
          </div>
        )}

        {(gameState?.status === "playing" || gameState?.status === "finished") && (
          <>
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
              onMoveSuccess={handleMoveSuccess}
              onMoveError={handleMoveError}
              onSurrender={handleSurrender}
              onRestartGame={restartGame}
              onBackToHome={handleBackToHome}
            />
          </>
        )}

        {/* Loading states for mobile */}
        {!gameState && isConnected && (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-muted-foreground text-sm">Joining...</p>
          </div>
        )}

        {!isConnected && (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-destructive mx-auto mb-2"></div>
            <p className="text-destructive text-sm">Connecting...</p>
          </div>
        )}
      </div>

      {/* Desktop layout - keep existing with proper spacing */}
      <div className="hidden sm:block max-w-4xl mx-auto space-y-1.5 sm:space-y-4">
        {/* Header - more compact */}
        <div className="flex justify-between items-center bg-card rounded-lg sm:rounded-2xl p-1 sm:p-2 border">
          <div className="flex items-center gap-1 sm:gap-2">
            <button 
              onClick={() => router.push('/')}
              className="hover:scale-110 transition-transform duration-200 cursor-pointer"
              title="Return to Main Page"
            >
              <img 
                src="/favicon.svg" 
                alt="Kung Fu Chess Logo" 
                className="w-4 h-4 sm:w-6 sm:h-6" 
              />
            </button>
            <div>
              <div className="flex items-center gap-1 sm:gap-2">
                <h1 className="text-xs sm:text-sm font-bold">
                  <span className="sm:hidden">Kung Fu Chess</span>
                  <span className="hidden sm:inline">Kung Fu Chess</span>
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
        </div>

        {/* Loading states - more compact */}
        {!gameState && isConnected && (
          <Card className="rounded-lg sm:rounded-2xl animate-pulse">
            <CardContent className="p-1 sm:p-3 text-center">
              <div className="animate-spin rounded-full h-2.5 w-2.5 sm:h-4 sm:w-4 border-b-2 border-primary mx-auto mb-1 sm:mb-2"></div>
              <p className="text-muted-foreground text-xs sm:text-sm">
                Joining...
              </p>
            </CardContent>
          </Card>
        )}

        {!isConnected && (
          <Card className="border-destructive/50 rounded-lg sm:rounded-2xl animate-pulse">
            <CardContent className="p-1 sm:p-3 text-center">
              <div className="animate-spin rounded-full h-2.5 w-2.5 sm:h-4 sm:w-4 border-b-2 border-destructive mx-auto mb-1 sm:mb-2"></div>
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
            isMatchmaking={isMatchmaking}
            onFindRandomPlayer={findRandomPlayer}
            onCancelMatchmaking={cancelMatchmaking}
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
            onMoveSuccess={handleMoveSuccess}
            onMoveError={handleMoveError}
            onSurrender={handleSurrender}
            onRestartGame={restartGame}
            onBackToHome={handleBackToHome}
          />
        )}

        {gameState?.status === "finished" && (
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
            onMoveSuccess={handleMoveSuccess}
            onMoveError={handleMoveError}
            onSurrender={handleSurrender}
            onRestartGame={restartGame}
            onBackToHome={handleBackToHome}
          />
        )}
      </div>

      {/* Tip Modal */}
      <TipModal
        isOpen={tipPrompt.isPromptOpen}
        onClose={tipPrompt.closePrompt}
        onTipped={tipPrompt.onUserTipped}
      />
    </div>
  );
}

export default function GamePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <GamePageContent />
    </Suspense>
  );
}
