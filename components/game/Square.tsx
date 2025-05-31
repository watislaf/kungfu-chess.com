import React, { useState, useEffect } from "react";
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
  isLastMoveFrom: boolean;
  canMakeMove: boolean;
  nextMoveAvailableAt?: Date;
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
  isLastMoveFrom,
  canMakeMove,
  nextMoveAvailableAt,
  onClick,
}) => {
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update current time every second for countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate remaining time until next move
  const remainingSeconds = nextMoveAvailableAt 
    ? Math.max(0, Math.ceil((nextMoveAvailableAt.getTime() - currentTime) / 1000))
    : 0;

  // Animated border glow
  let borderColor = "border border-muted transition-all duration-300";
  if (isSelected)
    borderColor =
      "border-2 border-blue-500 shadow-[0_0_8px_2px_rgba(59,130,246,0.4)] animate-glow";
  else if (isPossibleTarget && canMakeMove)
    borderColor =
      "border-2 border-green-500/70 shadow-[0_0_8px_2px_rgba(34,197,94,0.4)] animate-glow";
  else if (isPossibleTarget && !canMakeMove)
    borderColor =
      "border-2 border-gray-500/70 shadow-[0_0_8px_2px_rgba(107,114,128,0.4)] animate-glow";
  else if (cooldowns.length > 0)
    borderColor =
      "border-2 border-blue-400/70 shadow-[0_0_8px_2px_rgba(96,165,250,0.3)] animate-glow";

  const baseColor = isLight
    ? "bg-stone-100 dark:bg-stone-200"
    : "bg-emerald-600 dark:bg-emerald-700";

  return (
    <div
      className={`aspect-square flex items-center justify-center text-sm sm:text-3xl transition-all duration-200 relative overflow-hidden ${baseColor} ${borderColor} ${
        isPlayerPiece && cooldowns.length === 0
          ? "cursor-pointer hover:bg-primary/20"
          : isPossibleTarget && canMakeMove
          ? "cursor-pointer hover:bg-green-500/20"
          : isPossibleTarget && !canMakeMove
          ? "cursor-not-allowed hover:bg-gray-500/20"
          : "cursor-default"
      }`}
      onClick={() => onClick(square)}
    >
      {/* Move trail indicator */}
      {isLastMoveFrom && (
        <div className="absolute inset-0 bg-blue-400/30 border-2 border-blue-400/60 animate-pulse" />
      )}
      
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
            cooldowns.length > 0 ? "opacity-60" : ""
          } animate-fade-in`}
        >
          <PieceSVG piece={piece} />
        </div>
      )}
      {/* Green dots for available moves */}
      {isPossibleTarget && !piece && canMakeMove && (
        <div className="w-1/3 h-1/3 rounded-full bg-green-500/50 z-10 animate-pulse" />
      )}
      {/* Gray dots with timer for unavailable moves */}
      {isPossibleTarget && !piece && !canMakeMove && (
        <div className="flex flex-col items-center justify-center z-10">
          <div className="w-1/3 h-1/3 rounded-full bg-gray-500/50 animate-pulse" />
          {remainingSeconds > 0 && (
            <div className="text-xs text-gray-400 font-bold mt-1 bg-black/30 rounded px-1">
              {remainingSeconds}s
            </div>
          )}
        </div>
      )}
      {/* Border highlight for pieces that can be captured */}
      {isPossibleTarget && piece && canMakeMove && (
        <div className="absolute inset-0 border-2 border-green-500/70 rounded-sm z-10 animate-glow" />
      )}
      {/* Gray border highlight for pieces that could be captured but no bullets */}
      {isPossibleTarget && piece && !canMakeMove && (
        <div className="absolute inset-0 border-2 border-gray-500/70 rounded-sm z-10 animate-glow">
          {remainingSeconds > 0 && (
            <div className="absolute bottom-0 right-0 text-xs text-gray-300 font-bold bg-black/50 rounded-tl px-1">
              {remainingSeconds}s
            </div>
          )}
        </div>
      )}
    </div>
  );
};
