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
import { Settings, Clock, Zap, HelpCircle } from "lucide-react";
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
      debouncedSave({
        maxMovesPerPeriod,
        pieceCooldownSeconds,
      });
    }
  }, [maxMovesPerPeriod, pieceCooldownSeconds, debouncedSave, isSpectator]);

  // Update local state when currentSettings change (from other player)
  useEffect(() => {
    if (currentSettings) {
      setMaxMovesPerPeriod(currentSettings.maxMovesPerPeriod);
      setPieceCooldownSeconds(currentSettings.pieceCooldownSeconds);
    }
  }, [currentSettings]);

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
                  </ul>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-4 pb-2 sm:pb-3">
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

        <p className="text-xs text-muted-foreground text-center">
          Settings auto-save as you type
        </p>
      </CardContent>
    </Card>
  );
}
