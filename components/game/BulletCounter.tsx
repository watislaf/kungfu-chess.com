"use client";

import { useEffect, useState } from "react";

interface BulletCounterProps {
  movesLeft: number;
  maxMoves: number;
  isReloading: boolean;
  isOpponent?: boolean;
  playerName?: string;
  bulletReloadTimes?: Date[]; // Individual reload times for each bullet
  cooldownSeconds?: number; // Duration of each bullet cooldown
  magazineError?: string | null; // Error message to show in tooltip
  magazineErrorKey?: number; // Key to trigger animation
}

interface BulletState {
  isLoaded: boolean;
  isReloading: boolean;
  reloadProgress: number;
  reloadEndTime?: Date;
}

// Add shake animation CSS
const shakeKeyframes = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
    20%, 40%, 60%, 80% { transform: translateX(3px); }
  }
`;

export function BulletCounter({
  movesLeft,
  maxMoves,
  isReloading,
  isOpponent = false,
  playerName = "You",
  bulletReloadTimes = [],
  cooldownSeconds = 10,
  magazineError = null,
  magazineErrorKey = 0,
}: BulletCounterProps) {
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update current time every 100ms for smooth reload animations
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Calculate individual bullet states
  const getBulletStates = (): BulletState[] => {
    const states: BulletState[] = [];
    
    // Sort reload times by when they will complete (earliest first)
    const sortedReloadTimes = [...bulletReloadTimes]
      .filter(time => time.getTime() > currentTime)
      .sort((a, b) => a.getTime() - b.getTime());
    
    for (let i = 0; i < maxMoves; i++) {
      // Check if this bullet position has a reload time
      const reloadTime = sortedReloadTimes[i];
      const isCurrentlyReloading = reloadTime && reloadTime.getTime() > currentTime;
      
      let reloadProgress = 0;
      if (isCurrentlyReloading && reloadTime) {
        const totalCooldownMs = cooldownSeconds * 1000;
        const timeWhenStarted = reloadTime.getTime() - totalCooldownMs;
        const timeElapsed = currentTime - timeWhenStarted;
        reloadProgress = Math.max(0, Math.min(1, timeElapsed / totalCooldownMs));
      }
      
      // Determine if bullet is loaded
      // Bullets are consumed from the TOP (lowest indices first)
      // So top bullets (0, 1, 2...) are the first to be consumed
      const bulletsReloading = sortedReloadTimes.length;
      const bulletsLoaded = maxMoves - bulletsReloading;
      
      // If we have bullets reloading, the TOP positions should be reloading
      // The BOTTOM positions should be loaded
      const isLoaded = i >= bulletsReloading; // Bottom bullets are loaded
      const isCurrentlyReloadingThisPosition = i < bulletsReloading; // Top bullets are reloading
      
      states.push({
        isLoaded: isLoaded,
        isReloading: isCurrentlyReloadingThisPosition && Boolean(sortedReloadTimes[i]),
        reloadProgress: isCurrentlyReloadingThisPosition ? reloadProgress : 0,
        reloadEndTime: isCurrentlyReloadingThisPosition ? sortedReloadTimes[i] : undefined,
      });
    }
    
    return states;
  };

  const bulletStates = getBulletStates();

  const bullets = bulletStates.map((bulletState, index) => {
    // Display bullets from top to bottom (index matches bullet position)
    const state = bulletStates[index];
    
    return (
      <div key={index} className="relative">
        <div
          className={`w-3 h-8 rounded-full transition-all duration-300 border ${
            state.isLoaded
              ? isOpponent
                ? "bg-red-500 shadow-red-500/50 border-red-400"
                : "bg-green-500 shadow-green-500/50 border-green-400"
              : state.isReloading
              ? "bg-gray-700 border-yellow-400 shadow-yellow-400/30"
              : "bg-gray-600 border-gray-500"
          } shadow-sm`}
        />
        
        {/* Individual reload progress animation */}
        {state.isReloading && (
          <>
            {/* Background for reload animation */}
            <div className="absolute inset-0 rounded-full overflow-hidden bg-gray-800">
              {/* Progress fill */}
              <div 
                className={`${
                  isOpponent ? "bg-red-400/70" : "bg-green-400/70"
                } transition-all duration-100 ease-linear rounded-full`}
                style={{ 
                  height: `${state.reloadProgress * 100}%`,
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                }}
              />
              
              {/* Animated loading indicator */}
              <div 
                className={`absolute inset-0 border-2 rounded-full ${
                  isOpponent ? "border-red-400" : "border-green-400"
                } animate-pulse`}
                style={{
                  background: `conic-gradient(from 0deg, transparent 0deg, ${
                    isOpponent ? "#ef4444" : "#22c55e"
                  } ${state.reloadProgress * 360}deg, transparent ${state.reloadProgress * 360}deg)`
                }}
              />
            </div>
            
            {/* Loading dots animation */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex space-x-0.5">
                <div className={`w-0.5 h-0.5 ${isOpponent ? "bg-red-200" : "bg-green-200"} rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></div>
                <div className={`w-0.5 h-0.5 ${isOpponent ? "bg-red-200" : "bg-green-200"} rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></div>
                <div className={`w-0.5 h-0.5 ${isOpponent ? "bg-red-200" : "bg-green-200"} rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </>
        )}
        
        {/* Bullet position indicator */}
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
          <div className={`w-1 h-1 rounded-full ${
            state.isLoaded 
              ? isOpponent ? "bg-red-300" : "bg-green-300"
              : "bg-gray-500"
          }`}></div>
        </div>
      </div>
    );
  });

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Inject shake animation CSS */}
      <style>{shakeKeyframes}</style>
      
      <div className="text-xs font-medium text-muted-foreground">
        {isOpponent ? "Opponent" : playerName}
      </div>
      
      {/* Magazine Container */}
      <div 
        key={magazineErrorKey}
        className={`relative bg-gray-800 border-2 rounded-lg p-3 transition-all duration-500 ${
          magazineError 
            ? "border-red-500 bg-red-900/20 shadow-red-500/50 shadow-lg animate-pulse animate-bounce" 
            : isReloading 
            ? "border-yellow-400 shadow-yellow-400/30 shadow-lg animate-pulse" 
            : "border-gray-600"
        }`}
        style={magazineError ? {
          animation: 'shake 0.2s ease-in-out'
        } : {}}
      >
        {/* Error Tooltip */}
        {magazineError && (
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-red-600 text-white text-xs px-3 py-2 rounded-lg shadow-lg z-10 whitespace-nowrap animate-bounce">
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-red-600"></div>
            </div>
            {magazineError}
          </div>
        )}
        
        {/* Bullets Display */}
        <div className="flex flex-col gap-1 items-center">
          {bullets}
        </div>
        
        {/* Magazine Base */}
        <div className="w-8 h-3 bg-gray-700 rounded-b mt-2 mx-auto"></div>
      </div>
      
      {/* Status Text */}
      <div className="text-xs text-center">
        {isReloading ? (
          <span className="text-yellow-400 animate-pulse">Reloading...</span>
        ) : (
          <span className={isOpponent ? "text-red-400" : "text-green-400"}>
            {movesLeft}/{maxMoves}
          </span>
        )}
      </div>
      
      {/* Individual bullet timers */}
      <div className="text-xs text-center space-y-0.5">
        {bulletStates.some(b => b.isReloading) && (
          <div className="flex flex-col gap-0.5">
            {bulletStates.map((bullet, index) => 
              bullet.isReloading && bullet.reloadEndTime ? (
                <div key={index} className={`text-xs ${isOpponent ? "text-red-300" : "text-green-300"}`}>
                  #{index + 1}: {Math.ceil((bullet.reloadEndTime.getTime() - currentTime) / 1000)}s
                </div>
              ) : null
            )}
          </div>
        )}
      </div>
    </div>
  );
} 