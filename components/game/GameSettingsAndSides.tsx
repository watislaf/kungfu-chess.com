"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Settings, Heart } from "lucide-react";
import { GameSettings, GameState } from "@/app/models/Game";
import { useGameSettings } from "@/lib/hooks/useGameSettings";
import { SettingsInputs } from "./SettingsInputs";
import { SettingsDisplay } from "./SettingsDisplay";
import { SideSelection } from "./SideSelection";
import { ReadyButton } from "./ReadyButton";
import { useTipPrompt } from "@/lib/hooks/useTipPrompt";
import { TipModal } from "../ui/TipModal";

interface GameSettingsAndSidesProps {
  gameState: GameState;
  playerId: string;
  onSettingsSubmit: (settings: GameSettings) => void;
  onSwitchSides: () => void;
  onReady: () => void;
  isSpectator: boolean;
  currentSettings?: GameSettings;
}

export function GameSettingsAndSides({
  gameState,
  playerId,
  onSettingsSubmit,
  onSwitchSides,
  onReady,
  isSpectator,
  currentSettings,
}: GameSettingsAndSidesProps) {
  const { settings, updateSettings } = useGameSettings({
    initialSettings: currentSettings,
    onSettingsChange: onSettingsSubmit,
  });

  const tipPrompt = useTipPrompt();

  const currentPlayer = gameState.players.find((p) => p.id === playerId);
  const otherPlayer = gameState.players.find((p) => p.id !== playerId);
  const canSwitch = !gameState.players.some((p) => p.isReady) && !isSpectator;
  const isReady = currentPlayer?.isReady || false;
  const showSettings = gameState.status !== "playing";
  const canEditSettings = showSettings && !isSpectator && !isReady;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Game Settings & Sides</span>
          </div>
          {showSettings && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-5 w-5 p-0 bg-red-900/20 border-red-900/50 text-red-400 hover:bg-red-900/40 button-animated"
              onClick={tipPrompt.openPrompt}
            >
              <Heart className="h-3 w-3" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 sm:space-y-3 px-2 sm:px-4 pb-2 sm:pb-3">
        {/* Game Settings */}
        {showSettings && !isSpectator ? (
          <SettingsInputs 
            settings={settings} 
            onChange={updateSettings} 
            disabled={!canEditSettings} 
          />
        ) : (
          !showSettings && <SettingsDisplay settings={settings} />
        )}

        {/* Side Selection */}
        <SideSelection
          players={gameState.players}
          playerId={playerId}
          canSwitch={canSwitch}
          onSwitchSides={onSwitchSides}
          isSpectator={isSpectator}
        />

        {/* Ready Button */}
        {!isSpectator && showSettings && (
          <ReadyButton
            currentPlayer={currentPlayer}
            otherPlayer={otherPlayer}
            bothReady={gameState.bothPlayersReady}
            onReady={onReady}
          />
        )}

        {/* Status Messages */}
        {!isSpectator && showSettings && !isReady && (
          <p className="text-xs text-muted-foreground text-center">
            Settings auto-save as you type
          </p>
        )}

        {!isSpectator && showSettings && isReady && (
          <p className="text-xs text-muted-foreground text-center">
            Settings locked - you are ready to play
          </p>
        )}
      </CardContent>
      
      {/* Tip Modal */}
      <TipModal
        isOpen={tipPrompt.isPromptOpen}
        onClose={tipPrompt.closePrompt}
        onTipped={tipPrompt.onUserTipped}
      />
    </Card>
  );
}
