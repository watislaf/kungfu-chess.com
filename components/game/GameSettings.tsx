"use client";

import { GameState } from "@/app/models/Game";
import { GameStatus } from "./GameStatus";
import { ReadyButton } from "./ReadyButton";
import { ShareGame } from "./ShareGame";
import { GameSettingsAndSides } from "./GameSettingsAndSides";

interface GameSettingsProps {
  gameState: GameState;
  playerId: string;
  shareableLink: string;
  onSwitchSides: () => void;
  onReady: () => void;
  onSettingsSubmit: (settings: any) => void;
  isSpectator: boolean;
}

export function GameSettings({
  gameState,
  playerId,
  shareableLink,
  onSwitchSides,
  onReady,
  onSettingsSubmit,
  isSpectator,
}: GameSettingsProps) {
  return (
    <div className="space-y-2 sm:space-y-6 animate-in fade-in duration-500">
      <GameStatus status="settings" />

      {/* Mobile: vertical layout, Desktop: grid */}
      <div className="flex flex-col gap-2 sm:grid sm:gap-6 xl:grid-cols-2">
        {/* Settings controls */}
        <div className="flex flex-col gap-2 sm:space-y-6">
          <GameSettingsAndSides
            gameState={gameState}
            playerId={playerId}
            onSettingsSubmit={onSettingsSubmit}
            onSwitchSides={onSwitchSides}
            isSpectator={isSpectator}
            currentSettings={gameState.settings}
          />

          {!isSpectator && (
            <ReadyButton
              gameState={gameState}
              playerId={playerId}
              onReady={onReady}
            />
          )}
        </div>

        {!isSpectator && <ShareGame shareableLink={shareableLink} />}
      </div>
    </div>
  );
}
