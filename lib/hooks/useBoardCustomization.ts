import { useState, useEffect } from "react";

interface BoardCustomizationState {
  boardTheme: string;
  pieceTheme: string;
}

const DEFAULT_STATE: BoardCustomizationState = {
  boardTheme: "classic",
  pieceTheme: "classic",
};

export function useBoardCustomization() {
  const [state, setState] = useState<BoardCustomizationState>(DEFAULT_STATE);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("chess-board-customization");
      if (stored) {
        const parsed = JSON.parse(stored);
        setState({
          boardTheme: parsed.boardTheme || DEFAULT_STATE.boardTheme,
          pieceTheme: parsed.pieceTheme || DEFAULT_STATE.pieceTheme,
        });
      }
    } catch (error) {
      console.warn("Failed to load board customization preferences:", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save preferences to localStorage whenever state changes
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem("chess-board-customization", JSON.stringify(state));
      } catch (error) {
        console.warn("Failed to save board customization preferences:", error);
      }
    }
  }, [state, isLoaded]);

  const setBoardTheme = (themeId: string) => {
    setState(prev => ({ ...prev, boardTheme: themeId }));
  };

  const setPieceTheme = (themeId: string) => {
    setState(prev => ({ ...prev, pieceTheme: themeId }));
  };

  return {
    boardTheme: state.boardTheme,
    pieceTheme: state.pieceTheme,
    setBoardTheme,
    setPieceTheme,
    isLoaded,
  };
} 