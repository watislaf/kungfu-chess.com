"use client";

import { useState, useEffect, useCallback } from 'react';

interface TipPromptState {
  gamesPlayed: number;
  hasTipped: boolean;
  lastPromptGame: number;
}

const STORAGE_KEY = 'rapid-chess-tip-prompt';
const PROMPT_INTERVAL = 2; // Show prompt every 2 games

export function useTipPrompt() {
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [tipState, setTipState] = useState<TipPromptState>({
    gamesPlayed: 0,
    hasTipped: false,
    lastPromptGame: 0,
  });

  // Load state from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsedState = JSON.parse(stored);
          setTipState(parsedState);
        }
      } catch (error) {
        console.error('Failed to load tip prompt state:', error);
      }
    }
  }, []);

  // Save state to localStorage whenever it changes
  const saveState = useCallback((newState: TipPromptState) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
        setTipState(newState);
      } catch (error) {
        console.error('Failed to save tip prompt state:', error);
      }
    }
  }, []);

  // Called when a game ends
  const onGameComplete = useCallback(() => {
    if (tipState.hasTipped) {
      // User has already tipped, don't prompt anymore
      return;
    }

    const newGamesPlayed = tipState.gamesPlayed + 1;
    const shouldPrompt = 
      newGamesPlayed > 0 && 
      newGamesPlayed % PROMPT_INTERVAL === 0 && 
      newGamesPlayed > tipState.lastPromptGame;

    const newState = {
      ...tipState,
      gamesPlayed: newGamesPlayed,
      lastPromptGame: shouldPrompt ? newGamesPlayed : tipState.lastPromptGame,
    };

    saveState(newState);

    if (shouldPrompt) {
      // Small delay to let game end animations complete
      setTimeout(() => {
        setIsPromptOpen(true);
      }, 1000);
    }
  }, [tipState, saveState]);

  // Called when user confirms they tipped
  const onUserTipped = useCallback(() => {
    const newState = {
      ...tipState,
      hasTipped: true,
    };
    saveState(newState);
    setIsPromptOpen(false);
  }, [tipState, saveState]);

  // Manual open (for the support button)
  const openPrompt = useCallback(() => {
    setIsPromptOpen(true);
  }, []);

  // Close prompt
  const closePrompt = useCallback(() => {
    setIsPromptOpen(false);
  }, []);

  // Reset tip state (for testing or if user wants to be prompted again)
  const resetTipState = useCallback(() => {
    const newState = {
      gamesPlayed: 0,
      hasTipped: false,
      lastPromptGame: 0,
    };
    saveState(newState);
  }, [saveState]);

  return {
    isPromptOpen,
    gamesPlayed: tipState.gamesPlayed,
    hasTipped: tipState.hasTipped,
    onGameComplete,
    onUserTipped,
    openPrompt,
    closePrompt,
    resetTipState,
  };
} 