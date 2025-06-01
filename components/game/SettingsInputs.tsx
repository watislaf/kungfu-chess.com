"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, Zap, Shuffle, Heart } from "lucide-react";
import { GameSettings } from "@/app/models/Game";

interface SettingsInputsProps {
  settings: GameSettings;
  onChange: (settings: GameSettings) => void;
  disabled?: boolean;
}

export function SettingsInputs({ settings, onChange, disabled = false }: SettingsInputsProps) {
  const updateSetting = (key: keyof GameSettings, value: any) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div className="space-y-1">
          <Label htmlFor="maxMoves" className="text-xs flex items-center gap-1">
            <Zap className="h-3 w-3 text-yellow-500" />
            <span>Moves/10s</span>
          </Label>
          <Input
            id="maxMoves"
            type="number"
            min="1"
            max="10"
            value={settings.maxMovesPerPeriod}
            onChange={(e) => updateSetting('maxMovesPerPeriod', parseInt(e.target.value) || 1)}
            disabled={disabled}
            className="text-xs h-7 rounded-md"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="cooldown" className="text-xs flex items-center gap-1">
            <Clock className="h-3 w-3 text-blue-500" />
            <span>Cooldown (s)</span>
          </Label>
          <Input
            id="cooldown"
            type="number"
            min="1"
            max="30"
            value={settings.pieceCooldownSeconds}
            onChange={(e) => updateSetting('pieceCooldownSeconds', parseInt(e.target.value) || 1)}
            disabled={disabled}
            className="text-xs h-7 rounded-md"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="randomPieces"
            checked={Boolean(settings.enableRandomPieceGeneration)}
            onChange={(e) => updateSetting('enableRandomPieceGeneration', e.target.checked)}
            disabled={disabled}
            className="h-4 w-4 rounded border-2 border-muted-foreground text-primary focus:ring-2 focus:ring-primary"
          />
          <Label htmlFor="randomPieces" className="text-xs flex items-center gap-1 cursor-pointer">
            <Shuffle className="h-3 w-3 text-purple-500" />
            <span>Random Piece Generation</span>
          </Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="hitPoints"
            checked={Boolean(settings.enableHitPointsSystem)}
            onChange={(e) => updateSetting('enableHitPointsSystem', e.target.checked)}
            disabled={disabled}
            className="h-4 w-4 rounded border-2 border-muted-foreground text-primary focus:ring-2 focus:ring-primary"
          />
          <Label htmlFor="hitPoints" className="text-xs flex items-center gap-1 cursor-pointer">
            <Heart className="h-3 w-3 text-red-500" />
            <span>Hit Points System (3 HP)</span>
          </Label>
        </div>
      </div>
    </div>
  );
} 