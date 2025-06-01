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
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640); // sm breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    // Reduce particle count on mobile for better performance
    const particleCount = isMobile ? 8 : 18;
    const maxVelocity = isMobile ? 8 : 12;
    const maxSize = isMobile ? 6 : 8;
    
    // Create initial particles
    const initialParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: centerX,
      y: centerY,
      vx: (Math.random() - 0.5) * maxVelocity,
      vy: (Math.random() - 0.5) * maxVelocity,
      opacity: 1,
      size: Math.random() * maxSize + 4, // Particles (4-10px mobile, 4-12px desktop)
    }));

    setParticles(initialParticles);

    // Animate particles
    const animateFrame = () => {
      setParticles(prev => 
        prev.map(particle => {
          const newX = particle.x + particle.vx * 0.6;
          const newY = particle.y + particle.vy * 0.6;
          
          // Constrain particles to stay within reasonable bounds (0-100%)
          const constrainedX = Math.max(0, Math.min(100, newX));
          const constrainedY = Math.max(0, Math.min(100, newY));
          
          return {
            ...particle,
            x: constrainedX,
            y: constrainedY,
            vx: particle.vx * 0.94, // Slower deceleration
            vy: particle.vy * 0.94,
            opacity: particle.opacity * 0.94, // Slower fade
            size: particle.size * 0.99, // Slower shrink
          };
        }).filter(particle => particle.opacity > 0.08) // Keep particles longer
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
  }, [centerX, centerY, isMobile]);

  return (
    <div 
      className={`absolute inset-0 pointer-events-none overflow-hidden ${playerSide === "black" ? "rotate-180" : ""}`}
      style={{
        // Ensure particles don't affect layout or create scrollbars
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10,
      }}
    >
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
              zIndex: 10,
            }}
          />
        );
      })}
    </div>
  );
} 