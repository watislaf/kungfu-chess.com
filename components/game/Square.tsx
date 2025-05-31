import React from "react";
import PieceSVG from "./PieceSVG";
import { CooldownOverlay } from "./CooldownOverlay";
import { PieceCooldown } from "@/app/models/Game";
import { Square as SquareType } from "chess.js";

interface SquareProps {
  square: SquareType;
  piece: string | null;
  isLight: boolean;
  isSelected: boolean;
  isPlayerPiece: boolean;
  isPossibleTarget: boolean;
  cooldowns: PieceCooldown[];
  playerId: string;
  playerSide: "white" | "black";
  onClick: (square: SquareType) => void;
}

export const Square: React.FC<SquareProps> = ({
  square,
  piece,
  isLight,
  isSelected,
  isPlayerPiece,
  isPossibleTarget,
  cooldowns,
  playerId,
  playerSide,
  onClick,
}) => {
  // Animated border glow
  let borderColor = "border border-muted transition-all duration-300";
  if (isSelected)
    borderColor =
      "border-2 border-blue-500 shadow-[0_0_8px_2px_rgba(59,130,246,0.4)] animate-glow";
  else if (isPossibleTarget)
    borderColor =
      "border-2 border-green-500/70 shadow-[0_0_8px_2px_rgba(34,197,94,0.4)] animate-glow";
  else if (cooldowns.length > 0)
    borderColor =
      "border-2 border-blue-400/70 shadow-[0_0_8px_2px_rgba(96,165,250,0.3)] animate-glow";

  const baseColor = isLight
    ? "bg-amber-100 dark:bg-amber-900/30"
    : "bg-amber-800 dark:bg-amber-950";

  return (
    <div
      className={`aspect-square flex items-center justify-center text-sm sm:text-3xl transition-all duration-200 relative overflow-hidden ${baseColor} ${borderColor} ${
        isPlayerPiece && cooldowns.length === 0
          ? "cursor-pointer hover:bg-primary/20"
          : isPossibleTarget
          ? "cursor-pointer hover:bg-green-500/20"
          : "cursor-default"
      }`}
      onClick={() => onClick(square)}
    >
      {cooldowns.map((cd, idx) => {
        const totalCooldown = 5; // This will be set by parent if needed
        const now = Date.now();
        const remaining = Math.max(0, (cd.availableAt.getTime() - now) / 1000);
        const progress = 1 - remaining / totalCooldown;
        const isMine = cd.playerId === playerId;
        return (
          <CooldownOverlay
            key={idx}
            isMine={isMine}
            progress={progress}
            remaining={remaining}
          />
        );
      })}
      {piece && (
        <div
          className={`relative z-10 w-3/4 h-3/4 transition-all duration-500 ${
            cooldowns.length > 0 ? "opacity-60 blur-[1px]" : ""
          } animate-fade-in`}
        >
          <PieceSVG piece={piece} />
        </div>
      )}
      {isPossibleTarget && !piece && (
        <div className="w-1/3 h-1/3 rounded-full bg-green-500/50 z-10 animate-pulse" />
      )}
      {isPossibleTarget && piece && (
        <div className="absolute inset-0 border-2 border-green-500/70 rounded-sm z-10 animate-glow" />
      )}
    </div>
  );
};
