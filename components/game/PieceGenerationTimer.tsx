import React, { useEffect, useState } from 'react';
import { Square } from 'chess.js';

interface PieceGenerationTimerProps {
  square: Square;
  cooldownEndTime: Date | string | null;
  isEnabled: boolean;
  playerSide: "white" | "black";
}

export function PieceGenerationTimer({ square, cooldownEndTime, isEnabled, playerSide }: PieceGenerationTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (!isEnabled || !cooldownEndTime) return;

    const updateTimer = () => {
      const now = Date.now();
      
      // Handle both Date objects and timestamps
      let endTime: number;
      if (cooldownEndTime instanceof Date) {
        endTime = cooldownEndTime.getTime();
      } else if (typeof cooldownEndTime === 'string') {
        endTime = new Date(cooldownEndTime).getTime();
      } else {
        endTime = cooldownEndTime;
      }
      
      const remaining = Math.max(0, endTime - now);
      setTimeLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 100); // Update more frequently for smooth countdown

    return () => clearInterval(interval);
  }, [cooldownEndTime, isEnabled]);

  if (!isEnabled || !cooldownEndTime || timeLeft === 0) return null;

  const seconds = Math.ceil(timeLeft / 1000);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
      <div 
        className={`bg-yellow-400/90 text-black text-xs font-bold px-3 py-2 rounded-lg border-2 border-yellow-500 shadow-lg animate-pulse backdrop-blur-sm ${
          playerSide === "black" ? "rotate-180" : ""
        }`}
      >
        <div className={`text-center ${playerSide === "black" ? "rotate-180" : ""}`}>
          <div className="text-[10px] font-semibold opacity-90 mb-1">Next Piece</div>
          <div className="text-lg font-bold leading-none">{seconds}s</div>
        </div>
      </div>
    </div>
  );
} 