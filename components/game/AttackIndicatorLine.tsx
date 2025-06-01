import React from "react";
import { Square as SquareType } from "chess.js";
import { Sword } from "lucide-react";

interface AttackIndicatorLineProps {
  from: SquareType;
  to: SquareType;
  playerSide: "white" | "black";
}

const AttackIndicatorLine: React.FC<AttackIndicatorLineProps> = ({
  from,
  to,
  playerSide,
}) => {
  // Convert square notation to grid coordinates
  const getCoords = (square: SquareType) => {
    const file = square.charCodeAt(0) - 97; // a=0, b=1, etc.
    const rank = 8 - parseInt(square[1]); // 8=0, 7=1, etc.
    return { x: file, y: rank };
  };

  const fromCoords = getCoords(from);
  const toCoords = getCoords(to);

  // Calculate percentages for positioning
  const fromX = (fromCoords.x + 0.5) * 12.5;
  const fromY = (fromCoords.y + 0.5) * 12.5;
  const toX = (toCoords.x + 0.5) * 12.5;
  const toY = (toCoords.y + 0.5) * 12.5;

  const dx = toX - fromX;
  const dy = toY - fromY;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  return (
    <div 
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{
        // Ensure effects don't affect layout or create scrollbars
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 30,
      }}
    >
      {/* Main attack line */}
      <div
        className="absolute bg-yellow-400 opacity-90 animate-pulse shadow-lg"
        style={{
          left: `${fromX}%`,
          top: `${fromY}%`,
          width: `${length}%`,
          height: '3px',
          transformOrigin: '0 50%',
          transform: `rotate(${angle}deg)`,
          boxShadow: '0 0 8px rgba(255, 193, 7, 0.8), 0 0 16px rgba(255, 193, 7, 0.4)',
          animation: 'attackPulse 1.5s ease-in-out',
        }}
      />
      
      {/* Sword icon at the middle of the line */}
      <div
        className="absolute flex items-center justify-center"
        style={{
          left: `${fromX + dx * 0.5}%`,
          top: `${fromY + dy * 0.5}%`,
          transform: `translate(-50%, -50%) rotate(${angle}deg)`,
        }}
      >
        <div className="bg-yellow-400 rounded-full p-1 shadow-lg border-2 border-yellow-300">
          <Sword className="w-3 h-3 text-yellow-900" />
        </div>
      </div>
      
      {/* Arrow pointing to the target */}
      <div
        className="absolute w-0 h-0 opacity-90"
        style={{
          left: `calc(${toX}% - 3px)`,
          top: `calc(${toY}% - 3px)`,
          transform: `rotate(${angle}deg)`,
          borderLeft: '6px solid #fbbf24',
          borderTop: '3px solid transparent',
          borderBottom: '3px solid transparent',
          filter: 'drop-shadow(0 0 4px rgba(255, 193, 7, 0.8))',
        }}
      />

      <style jsx>{`
        @keyframes attackPulse {
          0% { opacity: 0; transform: rotate(${angle}deg) scaleX(0); }
          20% { opacity: 1; transform: rotate(${angle}deg) scaleX(1); }
          80% { opacity: 1; transform: rotate(${angle}deg) scaleX(1); }
          100% { opacity: 0; transform: rotate(${angle}deg) scaleX(1); }
        }
      `}</style>
    </div>
  );
};

export { AttackIndicatorLine }; 