"use client";

import { Badge } from "@/components/ui/badge";
import { Clock, Zap, Shuffle, Heart } from "lucide-react";
import { GameSettings } from "@/app/models/Game";

interface SettingsDisplayProps {
  settings: GameSettings;
}

export function SettingsDisplay({ settings }: SettingsDisplayProps) {
  return (
    <div className="space-y-2">
      <div className="flex gap-2 sm:gap-4">
        <div className="flex items-center gap-1">
          <Zap className="h-3 w-3 text-yellow-500" />
          <Badge variant="outline" className="badge-animated">
            {settings.maxMovesPerPeriod}/10s
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-blue-500" />
          <Badge variant="outline" className="badge-animated">
            {settings.pieceCooldownSeconds}s
          </Badge>
        </div>
      </div>
      
      {/* Special modes indicators */}
      {(settings.enableRandomPieceGeneration || settings.enableHitPointsSystem) && (
        <div className="flex gap-2 sm:gap-4">
          {settings.enableRandomPieceGeneration && (
            <div className="flex items-center gap-1">
              <Shuffle className="h-3 w-3 text-purple-500" />
              <Badge variant="outline" className="badge-animated text-purple-600">
                Random Pieces
              </Badge>
            </div>
          )}
          {settings.enableHitPointsSystem && (
            <div className="flex items-center gap-1">
              <Heart className="h-3 w-3 text-red-500" />
              <Badge variant="outline" className="badge-animated text-red-600">
                3 HP System
              </Badge>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 