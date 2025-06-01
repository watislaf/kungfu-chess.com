"use client";

import { useEffect, useState } from "react";

interface BulletCounterProps {
  movesLeft: number;
  maxMoves: number;
  isReloading: boolean;
  isOpponent?: boolean;
  playerName?: string;
  bulletReloadTimes?: Date[];
  cooldownSeconds?: number;
  magazineError?: string | null;
  magazineErrorKey?: number;
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

  const bullets = bulletStates.map((state, index) => (
    <div key={index} className="relative">
      <div
        className={`sm:w-3 sm:h-8 w-6 h-2 rounded-full transition-all duration-300 border ${
          state.isLoaded
            ? isOpponent
              ? "bg-red-500 shadow-red-500/50 border-red-400"
              : "bg-green-500 shadow-green-500/50 border-green-400"
            : state.isReloading
            ? "bg-gray-700 border-yellow-400 shadow-yellow-400/30"
            : "bg-gray-600 border-gray-500"
        } shadow-sm`}
      />
      
      {/* Individual reload progress animation - adapted for mobile/desktop */}
      {state.isReloading && (
        <>
          {/* Progress fill - top to bottom on both mobile and desktop */}
          <div className="absolute inset-0 rounded-full overflow-hidden">
            <div 
              className={`${
                isOpponent ? "bg-red-400/70" : "bg-green-400/70"
              } transition-all duration-100 ease-linear rounded-full absolute top-0 left-0 w-full`}
              style={{ 
                // Fill from top to bottom for both mobile and desktop
                height: `${state.reloadProgress * 100}%`
              }}
            />
          </div>
          
          {/* Simplified loading indicator for mobile */}
          <div className="absolute inset-0 flex items-center justify-center sm:hidden">
            <div className={`w-1 h-1 ${isOpponent ? "bg-red-200" : "bg-green-200"} rounded-full animate-pulse`}></div>
          </div>
          
          {/* Full loading dots animation for desktop */}
          <div className="absolute inset-0 flex items-center justify-center hidden sm:flex">
            <div className="flex space-x-0.5">
              <div className={`w-0.5 h-0.5 ${isOpponent ? "bg-red-200" : "bg-green-200"} rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></div>
              <div className={`w-0.5 h-0.5 ${isOpponent ? "bg-red-200" : "bg-green-200"} rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></div>
              <div className={`w-0.5 h-0.5 ${isOpponent ? "bg-red-200" : "bg-green-200"} rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </>
      )}
    </div>
  ));

  // Determine if we should show simplified view for too many bullets
  const showSimplified = maxMoves > 8;
  const bulletsToShow = showSimplified ? Math.min(6, bulletStates.length) : bulletStates.length;
  const remainingBullets = showSimplified ? Math.max(0, bulletStates.length - bulletsToShow) : 0;

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
        className={`relative bg-gray-800 border-2 rounded-lg transition-all duration-500 ${
          magazineError 
            ? "border-red-500 bg-red-900/20 shadow-red-500/50 shadow-lg animate-pulse animate-bounce" 
            : isReloading 
            ? "border-yellow-400 shadow-yellow-400/30 shadow-lg animate-pulse" 
            : "border-gray-600"
        } ${showSimplified ? "p-2" : "p-3"}`}
        style={magazineError ? {
          animation: 'shake 0.2s ease-in-out'
        } : {}}
      >
        {/* Error Tooltip */}
        {magazineError && (
          <div className={`absolute -top-12 bg-red-600 text-white text-xs px-3 py-2 rounded-lg shadow-lg z-10 whitespace-nowrap animate-bounce ${
            isOpponent 
              ? "right-0" 
              : "left-0"
          }`}>
            <div className={`absolute bottom-0 transform translate-y-full ${
              isOpponent ? "right-4" : "left-4"
            }`}>
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-red-600"></div>
            </div>
            {magazineError}
          </div>
        )}
        
        {/* Bullets Display */}
        <div className="flex items-center flex-row gap-1 sm:flex-col sm:gap-1">
          {/* Show first few bullets */}
          {bullets.slice(0, bulletsToShow)}
          
          {/* Show dots for remaining bullets */}
          {remainingBullets > 0 && (
            <div className="flex items-center justify-center">
              <div className="text-gray-400 text-xs font-bold">
                +{remainingBullets}
              </div>
            </div>
          )}
        </div>
        
        {/* Magazine Base - adapted for mobile horizontal layout */}
        <div className="bg-gray-700 rounded-b mx-auto mt-2 w-8 h-2 sm:w-8 sm:h-3"></div>
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
      
      {/* Individual bullet timers - hide on mobile for simplified view */}
      {!showSimplified && (
        <div className="text-xs text-center space-y-0.5 hidden sm:block">
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
      )}
    </div>
  );
} 