"use client";

import { Square as SquareType } from "chess.js";

interface MoveIndicatorProps {
  from: SquareType;
  to: SquareType;
  playerSide: "white" | "black";
}

export function MoveIndicator({ from, to, playerSide }: MoveIndicatorProps) {
  // Convert square notation to grid coordinates
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
    <div 
      className={`absolute inset-0 pointer-events-none overflow-hidden ${playerSide === "black" ? "rotate-180" : ""}`}
      style={{
        // Ensure effects don't affect layout or create scrollbars
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 25,
      }}
    >
      {/* Arrow line */}
      <div
        className="absolute bg-blue-400 opacity-80 animate-fade-in shadow-lg"
        style={{
          left: `${fromX}%`,
          top: `${fromY}%`,
          width: `${length}%`,
          height: '4px',
          transformOrigin: '0 50%',
          transform: `rotate(${angle}deg)`,
          transition: 'opacity 0.3s ease-out',
          boxShadow: '0 0 8px rgba(59, 130, 246, 0.6)',
        }}
      />
      
      {/* Arrow head */}
      <div
        className="absolute w-0 h-0 opacity-80 animate-fade-in"
        style={{
          left: `calc(${toX}% - 8px)`,
          top: `calc(${toY}% - 8px)`,
          borderLeft: '8px solid #60a5fa',
          borderTop: '8px solid transparent',
          borderBottom: '8px solid transparent',
          transform: `rotate(${angle}deg)`,
          transition: 'opacity 0.3s ease-out',
          filter: 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.6))',
        }}
      />
      
      {/* From square highlight */}
      <div
        className="absolute bg-blue-300 opacity-40 animate-pulse border-2 border-blue-400"
        style={{
          left: `${fromCoords.x * 12.5}%`,
          top: `${fromCoords.y * 12.5}%`,
          width: '12.5%',
          height: '12.5%',
          boxShadow: 'inset 0 0 8px rgba(59, 130, 246, 0.3)',
        }}
      />
      
      {/* To square highlight */}
      <div
        className="absolute bg-blue-400 opacity-50 animate-pulse border-2 border-blue-500"
        style={{
          left: `${toCoords.x * 12.5}%`,
          top: `${toCoords.y * 12.5}%`,
          width: '12.5%',
          height: '12.5%',
          boxShadow: 'inset 0 0 12px rgba(59, 130, 246, 0.4)',
        }}
      />
      
      {/* Additional visual effect - pulsing dots along the path */}
      {[0.25, 0.5, 0.75].map((t, index) => (
        <div
          key={index}
          className="absolute w-2 h-2 bg-blue-400 rounded-full opacity-60 animate-pulse"
          style={{
            left: `${fromX + dx * t}%`,
            top: `${fromY + dy * t}%`,
            transform: 'translate(-50%, -50%)',
            animationDelay: `${index * 0.2}s`,
            boxShadow: '0 0 4px rgba(59, 130, 246, 0.8)',
          }}
        />
      ))}
    </div>
  );
} 