"use client";

import { RefreshCw, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GameState } from "@/app/models/Game";

interface SideSelectionProps {
  gameState: GameState;
  playerId: string;
  onSwitchSides: () => void;
  isSpectator?: boolean;
}

export function SideSelection({
  gameState,
  playerId,
  onSwitchSides,
  isSpectator = false,
}: SideSelectionProps) {
  const canSwitch = !gameState.players.some((p) => p.isReady) && !isSpectator;

  return (
    <Card className="rounded-lg sm:rounded-2xl">
      <CardHeader className="pb-1 sm:pb-3 px-2 sm:px-6 pt-2 sm:pt-6">
        <CardTitle className="text-xs sm:text-lg flex items-center gap-1 sm:gap-2">
          <Settings className="h-3 w-3 sm:h-5 sm:w-5" />
          <span className="hidden sm:inline">Choose Sides</span>
          <span className="sm:hidden">Sides</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 sm:space-y-4 px-2 sm:px-6 pb-2 sm:pb-6">
        {/* Mobile: horizontal layout with smaller cards */}
        <div className="flex gap-1 sm:grid sm:grid-cols-2 sm:gap-4">
          {gameState.players.map((player) => (
            <div
              key={player.id}
              className={`flex-1 p-1.5 sm:p-4 rounded-lg sm:rounded-2xl border transition-all duration-200 ${
                player.id === playerId && !isSpectator
                  ? "border-primary bg-primary/10 scale-[1.02]"
                  : "border-muted bg-muted/20"
              }`}
            >
              <div className="text-center space-y-0.5 sm:space-y-1">
                <div className="text-base sm:text-3xl animate-bounce">
                  {player.side === "white" ? "♔" : "♚"}
                </div>
                <div className="font-medium text-xs sm:text-base truncate">
                  {player.id === playerId && !isSpectator ? "YOU" : player.name}
                </div>
                <Badge
                  variant={player.side === "white" ? "default" : "secondary"}
                  className="text-xs rounded-sm sm:rounded-md px-0.5 sm:px-1 py-0"
                >
                  <span className="sm:hidden">
                    {player.side === "white" ? "W" : "B"}
                  </span>
                  <span className="hidden sm:inline">
                    {player.side === "white" ? "White" : "Black"}
                  </span>
                </Badge>
                {player.isReady && (
                  <Badge
                    variant="default"
                    className="bg-green-600 block text-xs rounded-sm sm:rounded-md animate-pulse px-0.5 sm:px-1 py-0"
                  >
                    <span className="sm:hidden">✓</span>
                    <span className="hidden sm:inline">Ready!</span>
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        {!isSpectator && (
          <>
            <div className="flex justify-center">
              <Button
                onClick={onSwitchSides}
                variant="outline"
                className="flex items-center gap-1 sm:gap-2 rounded-md sm:rounded-xl transition-all duration-200 hover:scale-105 h-6 sm:h-auto px-2 sm:px-4 text-xs sm:text-sm"
                disabled={!canSwitch}
                size="sm"
              >
                <RefreshCw className="h-2.5 w-2.5 sm:h-4 sm:w-4" />
                <span>Switch</span>
              </Button>
            </div>

            {!canSwitch && !isSpectator && (
              <p className="text-xs text-muted-foreground text-center animate-pulse">
                <span className="sm:hidden">Can't switch after ready</span>
                <span className="hidden sm:inline">
                  Cannot switch after ready
                </span>
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
