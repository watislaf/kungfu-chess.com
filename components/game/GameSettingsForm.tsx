"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Settings, Clock, Zap, HelpCircle, Shuffle, Heart } from "lucide-react";
import { GameSettings } from "@/app/models/Game";

interface GameSettingsFormProps {
  onSettingsSubmit: (settings: GameSettings) => void;
  isSpectator: boolean;
  currentSettings?: GameSettings;
}

export function GameSettingsForm({
  onSettingsSubmit,
  isSpectator,
  currentSettings,
}: GameSettingsFormProps) {
  const [maxMovesPerPeriod, setMaxMovesPerPeriod] = useState(
    currentSettings?.maxMovesPerPeriod || 3
  );
  const [pieceCooldownSeconds, setPieceCooldownSeconds] = useState(
    currentSettings?.pieceCooldownSeconds || 5
  );
  const [enableRandomPieceGeneration, setEnableRandomPieceGeneration] = useState(
    currentSettings?.enableRandomPieceGeneration || false
  );
  const [enableHitPointsSystem, setEnableHitPointsSystem] = useState(
    currentSettings?.enableHitPointsSystem || false
  );

  // Debounced auto-save
  const debouncedSave = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (settings: GameSettings) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          onSettingsSubmit(settings);
        }, 500); // 500ms debounce
      };
    })(),
    [onSettingsSubmit]
  );

  // Auto-save when settings change
  useEffect(() => {
    if (!isSpectator) {
      const newSettings = {
        maxMovesPerPeriod,
        pieceCooldownSeconds,
        enableRandomPieceGeneration,
        enableHitPointsSystem,
      };
      console.log('🔧 GameSettingsForm - Auto-saving settings:', newSettings);
      debouncedSave(newSettings);
    }
  }, [maxMovesPerPeriod, pieceCooldownSeconds, enableRandomPieceGeneration, enableHitPointsSystem, debouncedSave, isSpectator]);

  // Update local state when currentSettings change (from other player)
  useEffect(() => {
    if (currentSettings) {
      console.log('🔄 GameSettingsForm - External settings update:', {
        currentSettings,
        localValues: {
          maxMovesPerPeriod,
          pieceCooldownSeconds,
          enableRandomPieceGeneration,
          enableHitPointsSystem
        }
      });
      
      if (currentSettings.maxMovesPerPeriod !== maxMovesPerPeriod) {
        console.log('📊 GameSettingsForm - Updating maxMovesPerPeriod:', currentSettings.maxMovesPerPeriod);
        setMaxMovesPerPeriod(currentSettings.maxMovesPerPeriod);
      }
      
      if (currentSettings.pieceCooldownSeconds !== pieceCooldownSeconds) {
        console.log('⏰ GameSettingsForm - Updating pieceCooldownSeconds:', currentSettings.pieceCooldownSeconds);
        setPieceCooldownSeconds(currentSettings.pieceCooldownSeconds);
      }
      
      if (currentSettings.enableRandomPieceGeneration !== enableRandomPieceGeneration) {
        console.log('🎲 GameSettingsForm - Updating enableRandomPieceGeneration:', currentSettings.enableRandomPieceGeneration);
        setEnableRandomPieceGeneration(currentSettings.enableRandomPieceGeneration);
      }
      
      if (currentSettings.enableHitPointsSystem !== enableHitPointsSystem) {
        console.log('❤️ GameSettingsForm - Updating enableHitPointsSystem:', currentSettings.enableHitPointsSystem);
        setEnableHitPointsSystem(currentSettings.enableHitPointsSystem);
      }
    }
  }, [currentSettings, maxMovesPerPeriod, pieceCooldownSeconds, enableRandomPieceGeneration, enableHitPointsSystem]);

  if (isSpectator) {
    return (
      <Card className="rounded-lg sm:rounded-xl">
        <CardHeader className="pb-1 sm:pb-2 px-2 sm:px-4 pt-2 sm:pt-3">
          <CardTitle className="text-xs sm:text-sm flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Game Settings</span>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                  <HelpCircle className="h-3 w-3" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Game Rules</DialogTitle>
                </DialogHeader>
                <div className="space-y-2">
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Players can move simultaneously (no turns)</li>
                    <li>
                      • Limited to {currentSettings?.maxMovesPerPeriod || 3}{" "}
                      moves per 10 seconds
                    </li>
                    <li>
                      • Each piece has{" "}
                      {currentSettings?.pieceCooldownSeconds || 5}s cooldown
                      after moving
                    </li>
                    <li>• Standard chess rules apply for valid moves</li>
                    {currentSettings?.enableRandomPieceGeneration && (
                      <li className="text-purple-600">
                        • Random pieces spawn on empty rook squares every few seconds
                      </li>
                    )}
                    {currentSettings?.enableHitPointsSystem && (
                      <li className="text-red-600">
                        • Pieces have 3 hit points - must be attacked 3 times to be captured
                      </li>
                    )}
                  </ul>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-4 pb-2 sm:pb-3">
          <div className="space-y-2">
          <div className="flex gap-2 sm:gap-4">
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-yellow-500" />
              <Badge variant="outline" className="text-xs px-1 py-0">
                {currentSettings?.maxMovesPerPeriod || 3}/10s
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-blue-500" />
              <Badge variant="outline" className="text-xs px-1 py-0">
                {currentSettings?.pieceCooldownSeconds || 5}s
              </Badge>
            </div>
            </div>
            
            {/* Special modes indicators */}
            {(currentSettings?.enableRandomPieceGeneration || currentSettings?.enableHitPointsSystem) && (
              <div className="flex gap-2 sm:gap-4">
                {currentSettings?.enableRandomPieceGeneration && (
                  <div className="flex items-center gap-1">
                    <Shuffle className="h-3 w-3 text-purple-500" />
                    <Badge variant="outline" className="text-xs px-1 py-0 text-purple-600">
                      Random Pieces
                    </Badge>
                  </div>
                )}
                {currentSettings?.enableHitPointsSystem && (
                  <div className="flex items-center gap-1">
                    <Heart className="h-3 w-3 text-red-500" />
                    <Badge variant="outline" className="text-xs px-1 py-0 text-red-600">
                      3 HP System
                    </Badge>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-lg sm:rounded-xl">
      <CardHeader className="pb-1 sm:pb-2 px-2 sm:px-4 pt-2 sm:pt-3">
        <CardTitle className="text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Game Settings</span>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                <HelpCircle className="h-3 w-3" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Game Rules</DialogTitle>
              </DialogHeader>
              <div className="space-y-2">
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Players can move simultaneously (no turns)</li>
                  <li>• Limited to {maxMovesPerPeriod} moves per 10 seconds</li>
                  <li>
                    • Each piece has {pieceCooldownSeconds}s cooldown after
                    moving
                  </li>
                  <li>• Standard chess rules apply for valid moves</li>
                  {enableRandomPieceGeneration && (
                    <li className="text-purple-600">
                      • Random pieces spawn on empty rook squares every few seconds
                    </li>
                  )}
                  {enableHitPointsSystem && (
                    <li className="text-red-600">
                      • Pieces have 3 hit points - must be attacked 3 times to be captured
                    </li>
                  )}
                </ul>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 sm:space-y-3 px-2 sm:px-4 pb-2 sm:pb-3">
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div className="space-y-1">
            <Label
              htmlFor="maxMoves"
              className="text-xs flex items-center gap-1"
            >
              <Zap className="h-3 w-3 text-yellow-500" />
              <span>Moves/10s</span>
            </Label>
            <Input
              id="maxMoves"
              type="number"
              min="1"
              max="10"
              value={maxMovesPerPeriod}
              onChange={(e) =>
                setMaxMovesPerPeriod(parseInt(e.target.value) || 1)
              }
              className="text-xs h-7 rounded-md"
            />
          </div>

          <div className="space-y-1">
            <Label
              htmlFor="cooldown"
              className="text-xs flex items-center gap-1"
            >
              <Clock className="h-3 w-3 text-blue-500" />
              <span>Cooldown (s)</span>
            </Label>
            <Input
              id="cooldown"
              type="number"
              min="1"
              max="30"
              value={pieceCooldownSeconds}
              onChange={(e) =>
                setPieceCooldownSeconds(parseInt(e.target.value) || 1)
              }
              className="text-xs h-7 rounded-md"
            />
          </div>
        </div>

        {/* Special Game Modes */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="randomPieces"
              checked={enableRandomPieceGeneration}
              onChange={(e) => {
                console.log('🎲 GameSettingsForm - Random piece generation toggled:', e.target.checked);
                setEnableRandomPieceGeneration(e.target.checked);
              }}
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
              checked={enableHitPointsSystem}
              onChange={(e) => {
                console.log('❤️ GameSettingsForm - Hit points system toggled:', e.target.checked);
                setEnableHitPointsSystem(e.target.checked);
              }}
              className="h-4 w-4 rounded border-2 border-muted-foreground text-primary focus:ring-2 focus:ring-primary"
            />
            <Label htmlFor="hitPoints" className="text-xs flex items-center gap-1 cursor-pointer">
              <Heart className="h-3 w-3 text-red-500" />
              <span>Hit Points System (3 HP)</span>
            </Label>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Settings auto-save as you type
        </p>
      </CardContent>
    </Card>
  );
}
