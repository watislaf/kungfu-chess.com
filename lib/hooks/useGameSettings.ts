"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { GameSettings } from "@/app/models/Game";

interface UseGameSettingsProps {
  initialSettings?: GameSettings;
  onSettingsChange: (settings: GameSettings) => void;
  isSpectator?: boolean;
}

const DEFAULT_SETTINGS: GameSettings = {
  maxMovesPerPeriod: 3,
  pieceCooldownSeconds: 5,
  enableRandomPieceGeneration: false,
  enableHitPointsSystem: false,
};

export function useGameSettings({ 
  initialSettings, 
  onSettingsChange, 
  isSpectator = false 
}: UseGameSettingsProps) {
  const [settings, setSettings] = useState<GameSettings>(() => ({
    ...DEFAULT_SETTINGS,
    ...initialSettings,
  }));
  
  const lastSubmittedRef = useRef<GameSettings | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Debounced settings submission
  const debouncedSubmit = useCallback((newSettings: GameSettings) => {
    if (isSpectator) return;
    
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      // Only submit if settings actually changed
      if (JSON.stringify(newSettings) !== JSON.stringify(lastSubmittedRef.current)) {
        lastSubmittedRef.current = newSettings;
        onSettingsChange(newSettings);
      }
    }, 300);
  }, [onSettingsChange, isSpectator]);

  // Update settings from external source
  const updateSettings = useCallback((newSettings: GameSettings) => {
    const effectiveSettings = { ...DEFAULT_SETTINGS, ...newSettings };
    setSettings(effectiveSettings);
    lastSubmittedRef.current = effectiveSettings;
  }, []);

  // Handle local settings changes
  const handleSettingsChange = useCallback((newSettings: GameSettings) => {
    setSettings(newSettings);
    debouncedSubmit(newSettings);
  }, [debouncedSubmit]);

  // Update when initial settings change (from external source)
  useEffect(() => {
    if (initialSettings) {
      updateSettings(initialSettings);
    }
  }, [initialSettings, updateSettings]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    settings,
    updateSettings: handleSettingsChange,
  };
} 