"use client";

import { Check, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GameState } from "@/app/models/Game";

interface ReadyButtonProps {
  gameState: GameState;
  playerId: string;
  onReady: () => void;
}

export function ReadyButton({
  gameState,
  playerId,
  onReady,
}: ReadyButtonProps) {
  const currentPlayer = gameState.players.find((p) => p.id === playerId);
  const otherPlayer = gameState.players.find((p) => p.id !== playerId);
  const isReady = currentPlayer?.isReady || false;
  const bothReady = gameState.bothPlayersReady;

  return (
    <Card className="rounded-lg sm:rounded-2xl">
      <CardContent className="p-1.5 sm:p-4 space-y-1 sm:space-y-4">
        <div className="flex justify-center">
          <Button
            onClick={onReady}
            disabled={isReady}
            size="sm"
            className={`w-full max-w-xs rounded-md sm:rounded-xl transition-all duration-200 hover:scale-105 h-7 sm:h-auto text-xs sm:text-sm ${
              isReady
                ? "bg-green-600 hover:bg-green-600"
                : "bg-primary hover:bg-primary/90"
            }`}
          >
            {isReady ? (
              <>
                <Check className="mr-1 sm:mr-2 h-2.5 w-2.5 sm:h-5 sm:w-5" />
                <span className="sm:hidden">Ready!</span>
                <span className="hidden sm:inline">You're Ready!</span>
              </>
            ) : (
              <>
                <Clock className="mr-1 sm:mr-2 h-2.5 w-2.5 sm:h-5 sm:w-5" />
                <span className="sm:hidden">Ready?</span>
                <span className="hidden sm:inline">I'm Ready!</span>
              </>
            )}
          </Button>
        </div>

        <div className="text-center space-y-1 sm:space-y-2">
          <div className="flex justify-center gap-1 flex-wrap">
            <Badge
              variant={isReady ? "default" : "outline"}
              className={`text-xs rounded-sm sm:rounded-md px-0.5 sm:px-1 py-0 ${
                isReady ? "bg-green-600" : ""
              }`}
            >
              <span className="sm:hidden">YOU: {isReady ? "✓" : "✗"}</span>
              <span className="hidden sm:inline">
                YOU: {isReady ? "Ready" : "Not Ready"}
              </span>
            </Badge>
            <Badge
              variant={otherPlayer?.isReady ? "default" : "outline"}
              className={`text-xs rounded-sm sm:rounded-md px-0.5 sm:px-1 py-0 ${
                otherPlayer?.isReady ? "bg-green-600" : ""
              }`}
            >
              <span className="sm:hidden">
                {otherPlayer?.name?.slice(0, 3) || "OPP"}:{" "}
                {otherPlayer?.isReady ? "✓" : "✗"}
              </span>
              <span className="hidden sm:inline">
                {otherPlayer?.name || "Opponent"}:{" "}
                {otherPlayer?.isReady ? "Ready" : "Not Ready"}
              </span>
            </Badge>
          </div>

          {bothReady && (
            <p className="text-xs text-green-400 font-medium animate-bounce">
              <span className="sm:hidden">🎉 Starting...</span>
              <span className="hidden sm:inline">
                🎉 Both players ready! Starting game...
              </span>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
