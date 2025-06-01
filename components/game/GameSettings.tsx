"use client";

import { GameState } from "@/app/models/Game";
import type { GameSettings } from "@/app/models/Game";
import { GameStatus } from "./GameStatus";
import { ShareGame } from "./ShareGame";
import { GameSettingsAndSides } from "./GameSettingsAndSides";

interface GameSettingsProps {
  gameState: GameState;
  playerId: string;
  shareableLink: string;
  onSwitchSides: () => void;
  onReady: () => void;
  onSettingsSubmit: (settings: GameSettings) => void;
  isSpectator: boolean;
}

const DEFAULT_SETTINGS: GameSettings = {
  maxMovesPerPeriod: 3,
  pieceCooldownSeconds: 5,
  enableRandomPieceGeneration: false,
  enableHitPointsSystem: false,
};

export function GameSettings({
  gameState,
  playerId,
  shareableLink,
  onSwitchSides,
  onReady,
  onSettingsSubmit,
  isSpectator,
}: GameSettingsProps) {
  const currentSettings = { ...DEFAULT_SETTINGS, ...gameState.settings };

  return (
    <div className="space-y-2 sm:space-y-6 animate-in fade-in duration-500">
      <GameStatus status="settings" />

      {/* Mobile: vertical layout, Desktop: grid */}
      <div className="flex flex-col gap-2 sm:grid sm:gap-6 xl:grid-cols-2">
        {/* Settings controls with integrated ready button */}
        <GameSettingsAndSides
          gameState={gameState}
          playerId={playerId}
          onSettingsSubmit={onSettingsSubmit}
          onSwitchSides={onSwitchSides}
          onReady={onReady}
          isSpectator={isSpectator}
          currentSettings={currentSettings}
        />

        {!isSpectator && <ShareGame shareableLink={shareableLink} />}
      </div>
    </div>
  );
}
