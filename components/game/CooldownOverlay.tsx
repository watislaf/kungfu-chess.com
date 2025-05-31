import React from "react";

interface CooldownOverlayProps {
  isMine: boolean;
  progress: number;
  remaining: number;
  className?: string;
  style?: React.CSSProperties;
}

export const CooldownOverlay: React.FC<CooldownOverlayProps> = ({
  isMine,
  progress,
  remaining,
  className = "",
  style = {},
}) => (
  <div
    className={`absolute inset-0 flex items-end justify-center pointer-events-none z-20 transition-all duration-500 animate-fade-in ${
      isMine ? "bg-blue-500/40" : "bg-red-500/30"
    } ${className}`}
    style={{
      height: `${progress * 100}%`,
      borderRadius: 4,
      border: isMine ? "2px solid #3b82f6" : "2px solid #ef4444",
      boxShadow: isMine ? "0 0 8px #3b82f6" : "0 0 8px #ef4444",
      opacity: 0.85 - progress * 0.5,
      ...style,
    }}
  >
    <span className="text-xs font-bold text-white drop-shadow-sm mb-1 animate-pulse">
      {Math.ceil(remaining)}
    </span>
  </div>
);
