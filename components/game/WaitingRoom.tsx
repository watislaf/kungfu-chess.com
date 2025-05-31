"use client";

import { GameState } from "@/app/models/Game";
import { GameStatus } from "./GameStatus";
import { PlayerList } from "./PlayerList";
import { ShareGame } from "./ShareGame";

interface WaitingRoomProps {
  gameState: GameState;
  playerId: string;
  shareableLink: string;
  isSpectator: boolean;
}

export function WaitingRoom({
  gameState,
  playerId,
  shareableLink,
  isSpectator,
}: WaitingRoomProps) {
  return (
    <div className="space-y-2 sm:space-y-6 animate-in fade-in duration-500">
      <GameStatus status="waiting" playerCount={gameState.players.length} />

      <div className="flex flex-col gap-2 sm:grid sm:gap-6 lg:grid-cols-2">
        <PlayerList
          gameState={gameState}
          playerId={playerId}
          isSpectator={isSpectator}
        />
        {!isSpectator && <ShareGame shareableLink={shareableLink} />}
      </div>
    </div>
  );
}
