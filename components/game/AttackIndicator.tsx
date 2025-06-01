import React from "react";
import { Square as SquareType } from "chess.js";

interface AttackIndicatorProps {
  from: SquareType;
  to: SquareType;
  playerSide: "white" | "black";
}

export const AttackIndicator: React.FC<AttackIndicatorProps> = ({
  from,
  to,
  playerSide,
}) => {
  // Convert square notation to grid coordinates (same as MoveIndicator)
  const getCoords = (square: SquareType) => {
    const file = square.charCodeAt(0) - 97; // a=0, b=1, etc.
    const rank = 8 - parseInt(square[1]); // 8=0, 7=1, etc.
    return { x: file, y: rank };
  };

  const fromCoords = getCoords(from);
  const toCoords = getCoords(to);

  // Calculate position as percentages (each square is 12.5% of the board)
  const fromX = (fromCoords.x + 0.5) * 12.5; // Center of square
  const fromY = (fromCoords.y + 0.5) * 12.5;
  const toX = (toCoords.x + 0.5) * 12.5;
  const toY = (toCoords.y + 0.5) * 12.5;

  // Calculate arrow direction
  const dx = toX - fromX;
  const dy = toY - fromY;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      <div
        className="absolute bg-red-500 opacity-80 animate-pulse"
        style={{
          left: `${fromX}%`,
          top: `${fromY}%`,
          width: `${length}%`,
          height: '2px',
          transformOrigin: '0 50%',
          transform: `rotate(${angle}deg)`,
          boxShadow: '0 0 4px rgba(239, 68, 68, 0.8)',
        }}
      />
      
      {/* Small arrow at the end pointing to the king */}
      <div
        className="absolute w-0 h-0 opacity-80"
        style={{
          left: `calc(${toX}% - 2px)`,
          top: `calc(${toY}% - 2px)`,
          transform: `rotate(${angle}deg)`,
          borderLeft: '4px solid red',
          borderTop: '2px solid transparent',
          borderBottom: '2px solid transparent',
          filter: 'drop-shadow(0 0 2px rgba(239, 68, 68, 0.8))',
        }}
      />
    </div>
  );
}; 