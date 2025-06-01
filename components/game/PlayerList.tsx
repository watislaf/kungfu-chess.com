"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GameState } from "@/app/models/Game";

interface PlayerListProps {
  gameState: GameState;
  playerId: string;
  showReadyStatus?: boolean;
  isSpectator?: boolean;
}

export function PlayerList({
  gameState,
  playerId,
  showReadyStatus = false,
  isSpectator = false,
}: PlayerListProps) {
  return (
    <Card className="rounded-lg sm:rounded-2xl">
      <CardHeader className="pb-1 sm:pb-3 px-2 sm:px-6 pt-2 sm:pt-6">
        <CardTitle className="text-xs sm:text-lg">Players</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 sm:space-y-2 px-2 sm:px-6 pb-2 sm:pb-6">
        {gameState.players.map((player) => (
          <div
            key={player.id}
            className={`flex items-center justify-between p-1 sm:p-3 rounded-md sm:rounded-xl transition-all duration-200 ${
              player.id === playerId && !isSpectator
                ? "bg-primary/10 border border-primary/20 scale-[1.02]"
                : "bg-muted/50 hover:bg-muted/70"
            }`}
          >
            <div className="flex items-center space-x-1 sm:space-x-3">
              <div className="w-1 h-1 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="font-medium text-xs sm:text-base truncate max-w-[60px] sm:max-w-none">
                {player.name}
                {player.id === playerId && !isSpectator && (
                  <span className="text-xs text-muted-foreground ml-1">(You)</span>
                )}
              </span>
              {showReadyStatus && player.isReady && (
                <Badge
                  variant="default"
                  className="bg-green-600 text-xs rounded-sm sm:rounded-md animate-bounce px-0.5 sm:px-1 py-0"
                >
                  <span className="sm:hidden">✓</span>
                  <span className="hidden sm:inline">Ready</span>
                </Badge>
              )}
            </div>
            <Badge
              variant={player.side === "white" ? "default" : "secondary"}
              className="text-xs rounded-sm sm:rounded-md px-0.5 sm:px-1 py-0"
            >
              <span className="sm:hidden">
                {player.side === "white" ? "♔" : "♚"}
              </span>
              <span className="hidden sm:inline">
                {player.side === "white" ? "♔ White" : "♚ Black"}
              </span>
            </Badge>
          </div>
        ))}

        {gameState.players.length < 2 && (
          <div className="flex items-center justify-between p-1 sm:p-3 rounded-md sm:rounded-xl bg-muted/20 border-2 border-dashed border-muted-foreground/30 animate-pulse">
            <div className="flex items-center space-x-1 sm:space-x-3">
              <div className="w-1 h-1 sm:w-3 sm:h-3 bg-muted-foreground/50 rounded-full" />
              <span className="text-muted-foreground text-xs sm:text-sm">
                <span className="sm:hidden">Wait...</span>
                <span className="hidden sm:inline">Waiting...</span>
              </span>
            </div>
            <Badge
              variant="outline"
              className="text-muted-foreground text-xs rounded-sm sm:rounded-md px-0.5 sm:px-1 py-0"
            >
              {gameState.players.length === 0 ? "♔" : "♚"}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
