import React, { useState, useEffect } from "react";
import PieceSVG from "./PieceSVG";
import { CooldownOverlay } from "./CooldownOverlay";
import { PieceCooldown } from "@/app/models/Game";
import { Square as SquareType } from "chess.js";
import { BOARD_THEMES, type BoardTheme } from "./BoardCustomization";

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
  isKingInCheck?: boolean;
  hitPoints?: number;
  maxHitPoints?: number;
  isRandomGenerationEnabled?: boolean;
  isBeingAttacked?: boolean;
  isTakingDamage?: boolean;
  isPendingMove?: boolean;
  boardTheme?: string;
  pieceTheme?: string;
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
  isKingInCheck,
  hitPoints,
  maxHitPoints = 3,
  isRandomGenerationEnabled,
  isBeingAttacked,
  isTakingDamage,
  isPendingMove,
  boardTheme,
  pieceTheme,
  onClick,
}) => {
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    if (!canMakeMove && nextMoveAvailableAt) {
      const updateCountdown = () => {
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((nextMoveAvailableAt.getTime() - now) / 1000));
        setRemainingSeconds(remaining);
      };

      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
    } else {
      setRemainingSeconds(0);
    }
  }, [canMakeMove, nextMoveAvailableAt]);

  // Enhanced square styling with themes
  const isCornerSquare = ['a1', 'h1', 'a8', 'h8'].includes(square);
  const currentBoardTheme = BOARD_THEMES.find(theme => theme.id === boardTheme) || BOARD_THEMES[0];
  
  let baseColor;
  if (isCornerSquare && isRandomGenerationEnabled) {
    // Special colors for corner squares when random generation is enabled
    baseColor = isLight 
      ? "bg-gradient-to-br from-yellow-50 via-yellow-100 to-yellow-200 border border-yellow-400/50" 
      : "bg-gradient-to-br from-green-700 via-green-800 to-green-900 border border-yellow-400/50";
  } else {
    // Use theme colors
    baseColor = isLight 
      ? currentBoardTheme.lightSquare
      : currentBoardTheme.darkSquare;
  }
  
  const borderColor = isSelected 
    ? "ring-4 ring-blue-400 ring-opacity-75 shadow-lg shadow-blue-400/50" 
    : "";

  // King in check styling with pulsing red effect
  const kingThreatClass = isKingInCheck 
    ? "ring-4 ring-red-500 ring-opacity-90 animate-pulse bg-gradient-to-br from-red-200 via-red-300 to-red-400" 
    : "";

  // Pending move styling with subtle yellow glow
  const pendingMoveClass = isPendingMove 
    ? "ring-2 ring-yellow-400 ring-opacity-60 shadow-lg shadow-yellow-400/30" 
    : "";

  // Calculate missing hit points for display
  const showHitPoints = hitPoints !== undefined && maxHitPoints && hitPoints < maxHitPoints;
  const missingHitPoints = showHitPoints ? maxHitPoints - hitPoints : 0;

  return (
    <div
      className={`aspect-square flex items-center justify-center text-sm sm:text-3xl transition-all duration-200 relative overflow-hidden shadow-sm ${baseColor} ${borderColor} ${kingThreatClass} ${pendingMoveClass} ${
        isPlayerPiece && cooldowns.length === 0
          ? "cursor-pointer hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.02]"
          : isPossibleTarget && canMakeMove
          ? "cursor-pointer hover:shadow-lg hover:shadow-green-400/30 hover:scale-[1.02]"
          : isPossibleTarget && !canMakeMove
          ? "cursor-not-allowed hover:shadow-lg hover:shadow-gray-400/30"
          : "cursor-default"
      }`}
      onClick={() => onClick(square)}
    >
      {/* Subtle inner shadow for depth */}
      <div className="absolute inset-0 shadow-inner opacity-30" />
      
      {/* Move trail indicator with enhanced styling */}
      {isLastMoveFrom && (
        <div className="absolute inset-0 bg-gradient-radial from-blue-400/40 to-transparent border-2 border-blue-400/60 animate-pulse rounded-sm" />
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
          } ${isBeingAttacked ? "animate-shake" : ""} ${isTakingDamage ? "animate-damage-shake" : ""} animate-fade-in drop-shadow-sm`}
        >
          <PieceSVG piece={piece} theme={pieceTheme} />
          
          {/* Hit points indicator */}
          {showHitPoints && missingHitPoints > 0 && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 shadow-lg border border-red-600">
              -{missingHitPoints}
            </div>
          )}
        </div>
      )}
      
      {/* Enhanced move indicators */}
      {isPossibleTarget && !piece && canMakeMove && (
        <div className="w-1/3 h-1/3 rounded-full bg-green-500 z-10 animate-pulse shadow-lg border-2 border-green-600" />
      )}
      {isPossibleTarget && !piece && !canMakeMove && (
        <div className="flex flex-col items-center justify-center z-10">
          <div className="w-1/3 h-1/3 rounded-full bg-gray-500 animate-pulse shadow-lg border-2 border-gray-600" />
          {remainingSeconds > 0 && (
            <div className="text-xs text-gray-300 font-bold mt-1 bg-black/50 rounded px-1 shadow-sm">
              {remainingSeconds}s
            </div>
          )}
        </div>
      )}
      
      {/* Enhanced capture indicators */}
      {isPossibleTarget && piece && canMakeMove && (
        <div className="absolute inset-0 border-4 border-green-500 bg-green-400/30 rounded-sm z-10 animate-glow shadow-lg shadow-green-400/50" />
      )}
      {isPossibleTarget && piece && !canMakeMove && (
        <div className="absolute inset-0 border-4 border-gray-500 bg-gray-400/30 rounded-sm z-10 animate-glow shadow-lg shadow-gray-400/50">
          {remainingSeconds > 0 && (
            <div className="absolute bottom-0 right-0 text-xs text-gray-300 font-bold bg-black/60 rounded-tl px-1 shadow-sm">
              {remainingSeconds}s
            </div>
          )}
        </div>
      )}
    </div>
  );
};
