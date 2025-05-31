"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
import { Settings, Clock, Zap, HelpCircle, RefreshCw } from "lucide-react";
import { GameSettings, GameState } from "@/app/models/Game";
import { compareGameSettings } from "@/app/utils/deepCompare";
import { gameSettingsLogger } from "@/app/utils/debugLogger";

interface GameSettingsAndSidesProps {
  gameState: GameState;
  playerId: string;
  onSettingsSubmit: (settings: GameSettings) => void;
  onSwitchSides: () => void;
  isSpectator: boolean;
  currentSettings?: GameSettings;
}

export function GameSettingsAndSides({
  gameState,
  playerId,
  onSettingsSubmit,
  onSwitchSides,
  isSpectator,
  currentSettings,
}: GameSettingsAndSidesProps) {
  const [maxMovesPerPeriod, setMaxMovesPerPeriod] = useState(
    currentSettings?.maxMovesPerPeriod || 3
  );
  const [pieceCooldownSeconds, setPieceCooldownSeconds] = useState(
    currentSettings?.pieceCooldownSeconds || 5
  );
  const [isUpdatingFromExternal, setIsUpdatingFromExternal] = useState(false);
  const prevSettingsRef = useRef<GameSettings | undefined>(currentSettings);
  const lastSubmittedSettingsRef = useRef<GameSettings | undefined>(
    currentSettings
  );

  // Debounced auto-save with deep comparison
  const debouncedSave = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (settings: GameSettings) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          // Only submit if settings have actually changed
          if (
            !compareGameSettings(settings, lastSubmittedSettingsRef.current)
          ) {
            gameSettingsLogger.log("📤 Submitting settings change:", {
              old: lastSubmittedSettingsRef.current,
              new: settings,
            });
            lastSubmittedSettingsRef.current = settings;
            onSettingsSubmit(settings);
          } else {
            gameSettingsLogger.log(
              "⏭️ Skipping settings submission (no change):",
              settings
            );
          }
        }, 500); // 500ms debounce
      };
    })(),
    [onSettingsSubmit]
  );

  // Auto-save when settings change (but not when updating from external source)
  useEffect(() => {
    if (!isSpectator && !isUpdatingFromExternal) {
      const newSettings = {
        maxMovesPerPeriod,
        pieceCooldownSeconds,
      };

      // Only trigger debounced save if the settings have actually changed
      if (!compareGameSettings(newSettings, lastSubmittedSettingsRef.current)) {
        gameSettingsLogger.log(
          "🔄 Local settings changed, triggering debounced save:",
          newSettings
        );
        debouncedSave(newSettings);
      }
    }
  }, [
    maxMovesPerPeriod,
    pieceCooldownSeconds,
    debouncedSave,
    isSpectator,
    isUpdatingFromExternal,
  ]);

  // Update local state when currentSettings change (from other player)
  useEffect(() => {
    const prevSettings = prevSettingsRef.current;

    if (
      currentSettings &&
      (!prevSettings ||
        currentSettings.maxMovesPerPeriod !== prevSettings.maxMovesPerPeriod ||
        currentSettings.pieceCooldownSeconds !==
          prevSettings.pieceCooldownSeconds)
    ) {
      gameSettingsLogger.log("🔄 Settings changed externally:", {
        prev: prevSettings,
        current: currentSettings,
        localValues: { maxMovesPerPeriod, pieceCooldownSeconds },
      });

      setIsUpdatingFromExternal(true);
      setMaxMovesPerPeriod(currentSettings.maxMovesPerPeriod);
      setPieceCooldownSeconds(currentSettings.pieceCooldownSeconds);

      // Update the last submitted settings reference to prevent immediate re-submission
      lastSubmittedSettingsRef.current = currentSettings;

      // Reset the flag after a short delay
      setTimeout(() => {
        setIsUpdatingFromExternal(false);
      }, 100);
    }

    prevSettingsRef.current = currentSettings;
  }, [currentSettings]);

  const canSwitch = !gameState.players.some((p) => p.isReady) && !isSpectator;

  // Only show settings UI if not playing
  const showSettings = gameState.status !== "playing";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Game Settings & Sides</span>
          </div>
          {showSettings && (
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 button-animated"
                >
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
                      • Limited to {maxMovesPerPeriod} moves per 10 seconds
                    </li>
                    <li>
                      • Each piece has {pieceCooldownSeconds}s cooldown after
                      moving
                    </li>
                    <li>• Standard chess rules apply for valid moves</li>
                  </ul>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 sm:space-y-3 px-2 sm:px-4 pb-2 sm:pb-3">
        {/* Game Settings */}
        {showSettings && !isSpectator ? (
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
        ) : (
          !showSettings && (
            <div className="flex gap-2 sm:gap-4">
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3 text-yellow-500" />
                <Badge variant="outline" className="badge-animated">
                  {currentSettings?.maxMovesPerPeriod || 3}/10s
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-blue-500" />
                <Badge variant="outline" className="badge-animated">
                  {currentSettings?.pieceCooldownSeconds || 5}s
                </Badge>
              </div>
            </div>
          )
        )}

        {/* Side Selection */}
        <div className="space-y-1">
          <div className="flex gap-1 sm:gap-2">
            {gameState.players.map((player) => (
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
                    {player.id === playerId && !isSpectator
                      ? "YOU"
                      : player.name}
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

        {!isSpectator && showSettings && (
          <p className="text-xs text-muted-foreground text-center">
            Settings auto-save as you type
          </p>
        )}
      </CardContent>
    </Card>
  );
}
