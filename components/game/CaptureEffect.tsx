"use client";

import { Square } from "chess.js";
import { useEffect, useState } from "react";

interface CaptureEffectProps {
  square: Square;
  playerSide: "white" | "black";
}

export function CaptureEffect({ square, playerSide }: CaptureEffectProps) {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    opacity: number;
    size: number;
  }>>([]);

  // Convert square notation to grid coordinates
  const getCoords = (square: Square) => {
    const file = square.charCodeAt(0) - 97; // a=0, b=1, etc.
    const rank = 8 - parseInt(square[1]); // 8=0, 7=1, etc.
    return { x: file, y: rank };
  };

  const coords = getCoords(square);
  const centerX = (coords.x + 0.5) * 12.5; // Center of square as percentage
  const centerY = (coords.y + 0.5) * 12.5;

  useEffect(() => {
    // Create initial particles
    const initialParticles = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      x: centerX,
      y: centerY,
      vx: (Math.random() - 0.5) * 12, // Increased velocity
      vy: (Math.random() - 0.5) * 12,
      opacity: 1,
      size: Math.random() * 8 + 4, // Larger particles (4-12px)
    }));

    setParticles(initialParticles);

    // Animate particles
    const animateFrame = () => {
      setParticles(prev => 
        prev.map(particle => ({
          ...particle,
          x: particle.x + particle.vx * 0.6, // Slightly faster movement
          y: particle.y + particle.vy * 0.6,
          vx: particle.vx * 0.94, // Slower deceleration
          vy: particle.vy * 0.94,
          opacity: particle.opacity * 0.94, // Slower fade
          size: particle.size * 0.99, // Slower shrink
        })).filter(particle => particle.opacity > 0.08) // Keep particles longer
      );
    };

    const interval = setInterval(animateFrame, 16); // ~60fps

    // Clean up after 1.5 second
    const cleanup = setTimeout(() => {
      setParticles([]);
      clearInterval(interval);
    }, 1500);

    return () => {
      clearInterval(interval);
      clearTimeout(cleanup);
    };
  }, [centerX, centerY]);

  return (
    <div className={`absolute inset-0 ${playerSide === "black" ? "rotate-180" : ""}`}>
      {/* Flash effect on capture square */}
      <div
        className="absolute bg-red-500 opacity-80 animate-ping"
        style={{
          left: `${coords.x * 12.5}%`,
          top: `${coords.y * 12.5}%`,
          width: '12.5%',
          height: '12.5%',
          animationDuration: '0.4s',
          animationIterationCount: '3',
          boxShadow: '0 0 20px rgba(239, 68, 68, 0.8)',
        }}
      />
      
      {/* Secondary flash ring */}
      <div
        className="absolute bg-orange-400 opacity-60 animate-ping"
        style={{
          left: `${coords.x * 12.5 - 1}%`,
          top: `${coords.y * 12.5 - 1}%`,
          width: '14.5%',
          height: '14.5%',
          animationDuration: '0.6s',
          animationIterationCount: '2',
          borderRadius: '4px',
          boxShadow: '0 0 16px rgba(251, 146, 60, 0.6)',
        }}
      />

      {/* Particles */}
      {particles.map(particle => {
        // Vary particle colors for more dramatic effect
        const colors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-red-500'];
        const colorClass = colors[particle.id % colors.length];
        
        return (
          <div
            key={particle.id}
            className={`absolute ${colorClass} rounded-full`}
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: particle.opacity,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              boxShadow: `0 0 ${particle.size}px rgba(239, 68, 68, ${particle.opacity * 0.5})`,
            }}
          />
        );
      })}
    </div>
  );
} 