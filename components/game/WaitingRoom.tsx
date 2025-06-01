"use client";

import { GameState } from "@/app/models/Game";
import { GameStatus } from "./GameStatus";
import { PlayerList } from "./PlayerList";
import { ShareGame } from "./ShareGame";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Users, Search, X } from "lucide-react";

interface WaitingRoomProps {
  gameState: GameState;
  playerId: string;
  shareableLink: string;
  isSpectator: boolean;
  isMatchmaking?: boolean;
  onFindRandomPlayer?: (playerName?: string) => void;
  onCancelMatchmaking?: () => void;
}

export function WaitingRoom({
  gameState,
  playerId,
  shareableLink,
  isSpectator,
  isMatchmaking = false,
  onFindRandomPlayer,
  onCancelMatchmaking,
}: WaitingRoomProps) {
  const currentPlayer = gameState.players.find(p => p.id === playerId);
  const showMatchmakingButton = !isSpectator && 
    gameState.players.length === 1 && 
    gameState.status === 'waiting' && 
    onFindRandomPlayer;

  const handleFindRandomPlayer = () => {
    if (onFindRandomPlayer && currentPlayer) {
      onFindRandomPlayer(currentPlayer.name);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4 animate-in fade-in duration-500">
      <GameStatus status="waiting" playerCount={gameState.players.length} />

      <div className="space-y-2 sm:space-y-3">
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

        {!isSpectator && (
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
    </div>
  );
}
