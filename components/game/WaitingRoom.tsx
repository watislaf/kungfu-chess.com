"use client";

import { GameState } from "@/app/models/Game";
import { GameStatus } from "./GameStatus";
import { PlayerList } from "./PlayerList";
import { ShareGame } from "./ShareGame";
import { GameModeSelector, GameModeConfig } from "./GameModeSelector";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Users, Search, X, Bot, LogOut, Home } from "lucide-react";
import React from "react";
import { useRouter } from "next/navigation";

interface WaitingRoomProps {
  gameState: GameState;
  playerId: string;
  shareableLink: string;
  isSpectator: boolean;
  isMatchmaking?: boolean;
  onFindRandomPlayer?: (playerName?: string) => void;
  onCancelMatchmaking?: () => void;
  onModeSelect?: (config: GameModeConfig) => void;
  isAIGame?: boolean;
  onStartAIGame?: () => void;
  onLeaveGame?: () => void;
}

export function WaitingRoom({
  gameState,
  playerId,
  shareableLink,
  isSpectator,
  isMatchmaking = false,
  onFindRandomPlayer,
  onCancelMatchmaking,
  onModeSelect,
  isAIGame = false,
  onStartAIGame,
  onLeaveGame,
}: WaitingRoomProps) {
  const router = useRouter();
  const currentPlayer = gameState.players.find(p => p.id === playerId);
  const showMatchmakingButton = !isSpectator && 
    gameState.players.length === 1 && 
    gameState.status === 'waiting' && 
    onFindRandomPlayer &&
    !isAIGame; // Hide matchmaking button in AI mode

  const handleFindRandomPlayer = () => {
    if (onFindRandomPlayer && currentPlayer) {
      onFindRandomPlayer(currentPlayer.name);
    }
  };

  const handleModeSelect = (config: GameModeConfig) => {
    if (onModeSelect) {
      onModeSelect(config);
    }
  };

  const handleStartAIGame = () => {
    if (onStartAIGame) {
      onStartAIGame();
    }
  };

  const handleExitToMain = () => {
    // Leave the game first if there's a leave handler
    if (onLeaveGame) {
      onLeaveGame();
    }
    // Navigate to main screen
    router.push('/');
  };

  return (
    <div className="space-y-3 sm:space-y-4 animate-in fade-in duration-500 relative">
      {/* Exit Button - Top Right */}
      <div className="absolute top-0 right-0 z-10">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleExitToMain}
          className="text-muted-foreground hover:text-foreground bg-background/80 backdrop-blur-sm border-border/50"
          title="Exit to Main Screen"
        >
          <Home className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Exit</span>
        </Button>
      </div>

      <GameStatus status="waiting" playerCount={isAIGame ? 2 : gameState.players.length} />

      <div className="space-y-2 sm:space-y-3">
        {/* Game Mode Selector - only show for single player in waiting room and not in AI mode */}
        {!isSpectator && gameState.players.length === 1 && gameState.status === 'waiting' && onModeSelect && !isAIGame && (
          <GameModeSelector 
            onModeSelect={handleModeSelect}
            disabled={isMatchmaking}
          />
        )}

        {/* AI Mode Indicator with Start Button */}
        {isAIGame && onStartAIGame && (
          <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-blue-600">
                <Bot className="w-5 h-5" />
                AI Mode Active
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                🤖 Ready to play against AI! Click the button below to start.
              </p>
              
              <Button 
                onClick={handleStartAIGame}
                className="w-full text-base py-3 h-12 font-semibold bg-blue-600 hover:bg-blue-700"
                variant="default"
              >
                <Bot className="w-5 h-5 mr-2" />
                Start AI Game
              </Button>
              
              <div className="text-xs text-gray-500 text-center">
                🎯 AI will analyze the board and special game rules
              </div>
            </CardContent>
          </Card>
        )}

        {showMatchmakingButton && (
          <Card className="border-2 border-primary/30 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-primary">
                <Users className="w-5 h-5" />
                Find Random Player
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Don't want to wait? Find someone else who's looking for a game!
              </p>
              
              {isMatchmaking ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-blue-600 font-medium">
                    <Search className="w-4 h-4 animate-spin" />
                    Searching for opponent with similar skill level...
                  </div>
                  <div className="text-xs text-gray-500 text-center">
                    🎯 Matching based on ranking and skill level
                  </div>
                  <Button 
                    variant="outline" 
                    size="default" 
                    onClick={onCancelMatchmaking}
                    className="w-full"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel Search
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={handleFindRandomPlayer}
                  className="w-full text-base py-3 h-12 font-semibold"
                  variant="default"
                >
                  <Search className="w-5 h-5 mr-2" />
                  Find Random Player
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {!isSpectator && !isAIGame && (
          <div className="border-2 border-green-200 dark:border-green-800 rounded-lg">
            <ShareGame shareableLink={shareableLink} />
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-border/50">
        <h3 className="text-xs text-muted-foreground mb-2 px-1 font-medium">
          Players in Room
        </h3>
        <PlayerList
          gameState={gameState}
          playerId={playerId}
          isSpectator={isSpectator}
        />
      </div>

      {/* Leave Game Button - Always visible */}
      {onLeaveGame && (
        <div className="pt-3 border-t border-border/50">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onLeaveGame}
            className="w-full text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Leave Game
          </Button>
        </div>
      )}
    </div>
  );
}
