import React, { useEffect, useState } from 'react';
import { Square } from 'chess.js';

interface PieceGenerationEffectProps {
  square: Square;
  playerSide: "white" | "black";
  onComplete: () => void;
}

export function PieceGenerationEffect({ square, playerSide, onComplete }: PieceGenerationEffectProps) {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    opacity: number;
    size: number;
    color: string;
  }>>([]);
  const [showPieceEntrance, setShowPieceEntrance] = useState(false);
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
    // Reduce particle count and effects on mobile for better performance
    const particleCount = isMobile ? 6 : 12;
    const maxVelocity = isMobile ? 8 : 12;
    const maxSize = isMobile ? 3 : 4;
    
    // Create more dramatic particles for piece generation
    const colors = ['#FFD700', '#FFA500', '#FF6B35', '#4ECDC4', '#45B7D1'];
    const initialParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: centerX,
      y: centerY,
      vx: (Math.random() - 0.5) * maxVelocity, // Adjusted for mobile
      vy: (Math.random() - 0.5) * maxVelocity,
      opacity: 0.8, // Higher initial opacity
      size: Math.random() * maxSize + 2, // Smaller particles on mobile (2-5px mobile, 2-6px desktop)
      color: colors[Math.floor(Math.random() * colors.length)]
    }));

    setParticles(initialParticles);

    // Start piece entrance animation after a short delay
    const entranceTimer = setTimeout(() => {
      setShowPieceEntrance(true);
    }, 150);

    // Animate particles
    const animateFrame = () => {
      setParticles(prev => 
        prev.map(particle => {
          const newX = particle.x + particle.vx * 0.8;
          const newY = particle.y + particle.vy * 0.8;
          
          // Constrain particles to stay within reasonable bounds (0-100%)
          const constrainedX = Math.max(0, Math.min(100, newX));
          const constrainedY = Math.max(0, Math.min(100, newY));
          
          return {
            ...particle,
            x: constrainedX,
            y: constrainedY,
            vx: particle.vx * 0.90, // Faster deceleration
            vy: particle.vy * 0.90,
            opacity: particle.opacity * 0.88, // Faster fade out
            size: particle.size * 0.95, // Faster shrink
          };
        }).filter(particle => particle.opacity > 0.05) // Remove faded particles
      );
    };

    const interval = setInterval(animateFrame, 16); // ~60fps

    // Clean up after 1 second (reduced from 1.5s)
    const cleanup = setTimeout(() => {
      setParticles([]);
      clearInterval(interval);
      onComplete();
    }, 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(cleanup);
      clearTimeout(entranceTimer);
    };
  }, [centerX, centerY, onComplete, isMobile]);

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
      {/* Apply counter-rotation to particles when board is rotated */}
      <div className={playerSide === "black" ? "rotate-180" : ""}>
        {/* Dramatic central burst effect - reduced on mobile */}
        <div
          className="absolute bg-gradient-radial from-yellow-300 via-orange-400 to-transparent animate-ping opacity-60"
          style={{
            left: `${coords.x * 12.5 + 2}%`,
            top: `${coords.y * 12.5 + 2}%`,
            width: isMobile ? '6.5%' : '8.5%', // Smaller effect on mobile
            height: isMobile ? '6.5%' : '8.5%',
            animationDuration: '0.6s',
            animationIterationCount: isMobile ? '1' : '2', // Fewer iterations on mobile
            borderRadius: '50%',
          }}
        />

        {/* Secondary pulse - hidden on mobile for performance */}
        {!isMobile && (
          <div
            className="absolute bg-gradient-radial from-blue-300 to-transparent animate-pulse opacity-40"
            style={{
              left: `${coords.x * 12.5 + 1}%`,
              top: `${coords.y * 12.5 + 1}%`,
              width: '10.5%',
              height: '10.5%',
              animationDuration: '0.8s',
              animationIterationCount: '1',
              borderRadius: '50%',
              animationDelay: '0.2s',
            }}
          />
        )}

        {/* Piece entrance animation overlay - simplified on mobile */}
        {showPieceEntrance && (
          <div
            className="absolute bg-gradient-radial from-white/30 to-transparent animate-bounce opacity-80"
            style={{
              left: `${coords.x * 12.5}%`,
              top: `${coords.y * 12.5}%`,
              width: '12.5%',
              height: '12.5%',
              animationDuration: '0.4s',
              animationIterationCount: isMobile ? '1' : '2', // Fewer bounces on mobile
              borderRadius: '10%',
              border: '2px solid gold',
              boxShadow: '0 0 15px rgba(255, 215, 0, 0.6)',
            }}
          />
        )}

        {/* Individual particles */}
        {particles.map(particle => (
          <div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              backgroundColor: particle.color,
              opacity: particle.opacity,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
              zIndex: 10,
            }}
          />
        ))}

        {/* Sparkle trail effect - hidden on mobile for performance */}
        {!isMobile && particles.length > 0 && (
          <div
            className="absolute animate-spin opacity-50"
            style={{
              left: `${centerX}%`,
              top: `${centerY}%`,
              width: '15%',
              height: '15%',
              transform: 'translate(-50%, -50%)',
              background: 'conic-gradient(from 0deg, transparent, gold, transparent, gold, transparent)',
              borderRadius: '50%',
              animationDuration: '1.5s',
              zIndex: 10,
            }}
          />
        )}
      </div>
    </div>
  );
} 