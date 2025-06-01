"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";
import { Player } from "@/app/models/Game";

interface SideSelectionProps {
  players: Player[];
  playerId: string;
  canSwitch: boolean;
  onSwitchSides: () => void;
  isSpectator?: boolean;
}

export function SideSelection({ players, playerId, canSwitch, onSwitchSides, isSpectator = false }: SideSelectionProps) {
  return (
    <div className="space-y-1">
      <div className="flex gap-1 sm:gap-2">
        {players.map((player) => (
          <div
            key={player.id}
            className={`flex-1 p-1.5 sm:p-2 rounded-lg border transition-all duration-200 ${
              player.id === playerId && !isSpectator
                ? "border-primary bg-primary/10 scale-[1.02]"
                : "border-muted bg-muted/20"
            }`}
          >
            <div className="text-center space-y-0.5">
              <div className="text-base sm:text-2xl animate-bounce">
                {player.side === "white" ? "♔" : "♚"}
              </div>
              <div className="font-medium text-xs truncate">
                {player.name}
                {player.id === playerId && !isSpectator && (
                  <span className="text-xs text-muted-foreground block">(You)</span>
                )}
              </div>
              <Badge
                variant={player.side === "white" ? "default" : "secondary"}
                className="badge-animated"
              >
                {player.side === "white" ? "W" : "B"}
              </Badge>
              {player.isReady && (
                <Badge
                  variant="default"
                  className="bg-green-600 block text-xs rounded-sm animate-pulse px-0.5 py-0 badge-animated"
                >
                  ✓
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>

      {!isSpectator && (
        <div className="flex justify-center">
          <Button
            onClick={onSwitchSides}
            variant="outline"
            className="flex items-center gap-1 rounded-md transition-all duration-200 hover:scale-105 h-6 px-2 text-xs button-animated"
            disabled={!canSwitch}
            size="sm"
          >
            <RefreshCw className="h-2.5 w-2.5" />
            <span>Switch</span>
          </Button>
        </div>
      )}
    </div>
  );
}
