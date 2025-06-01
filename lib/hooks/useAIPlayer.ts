import { useState, useEffect, useCallback, useRef } from 'react';
import { Square } from 'chess.js';
import { ChessAI, AIMove } from '../ai/ChessAI';

interface UseAIPlayerProps {
  isAIEnabled: boolean;
  aiSide: 'white' | 'black';
  aiDifficulty: 'easy' | 'medium' | 'hard';
  gameState: any;
  possibleMoves: { [square: string]: string[] };
  pieceCooldowns: any[];
  canMakeMove: boolean;
  onAIMove: (from: Square, to: Square) => void;
}

export function useAIPlayer({
  isAIEnabled,
  aiSide,
  aiDifficulty,
  gameState,
  possibleMoves,
  pieceCooldowns,
  canMakeMove,
  onAIMove
}: UseAIPlayerProps) {
  const [aiInstance, setAIInstance] = useState<ChessAI | null>(null);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [aiLastMove, setAiLastMove] = useState<AIMove | null>(null);
  const aiTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize AI instance
  useEffect(() => {
    if (isAIEnabled) {
      const ai = new ChessAI(aiSide, aiDifficulty);
      setAIInstance(ai);
      console.log(`🤖 AI initialized for ${aiSide} side with ${aiDifficulty} difficulty`);
    } else {
      setAIInstance(null);
    }
  }, [isAIEnabled, aiSide, aiDifficulty]);

  // Determine if it's AI's turn
  const isAITurn = useCallback(() => {
    if (!isAIEnabled || !gameState || gameState.status !== 'playing') {
      return false;
    }

    // In this chess variant, both players can move, but we need to determine
    // when AI should make a move based on the current player's side
    const currentPlayer = gameState.players?.find((p: any) => p.side === aiSide);
    return currentPlayer && canMakeMove;
  }, [isAIEnabled, gameState, aiSide, canMakeMove]);

  // Make AI move
  const makeAIMove = useCallback(async () => {
    if (!aiInstance || !isAITurn() || isAIThinking) {
      return;
    }

    setIsAIThinking(true);

    // Add a small delay to make AI moves feel more natural
    const thinkingTime = aiDifficulty === 'easy' ? 500 : aiDifficulty === 'medium' ? 1000 : 1500;

    try {
      // Convert game settings to AI format
      const aiSettings = {
        enableHitPointsSystem: gameState.settings?.enableHitPointsSystem || false,
        enableRandomPieceGeneration: gameState.settings?.enableRandomPieceGeneration || false,
        maxMovesPerPeriod: gameState.settings?.maxMovesPerPeriod || 3,
        pieceCooldownSeconds: gameState.settings?.pieceCooldownSeconds || 5
      };

      const bestMove = aiInstance.getBestMove(
        gameState.board,
        possibleMoves,
        aiSettings,
        pieceCooldowns,
        gameState
      );

      if (bestMove) {
        console.log(`🤖 AI found move: ${bestMove.from} to ${bestMove.to} (score: ${bestMove.score})`);
        console.log(`🤖 AI reasoning: ${bestMove.reasoning}`);
        
        setAiLastMove(bestMove);

        // Execute the move after thinking time
        aiTimeoutRef.current = setTimeout(() => {
          onAIMove(bestMove.from, bestMove.to);
          setIsAIThinking(false);
        }, thinkingTime);
      } else {
        console.log('🤖 AI found no valid moves');
        setIsAIThinking(false);
      }
    } catch (error) {
      console.error('🤖 AI move calculation error:', error);
      setIsAIThinking(false);
    }
  }, [aiInstance, isAITurn, isAIThinking, aiDifficulty, gameState, possibleMoves, pieceCooldowns, onAIMove]);

  // Auto-trigger AI moves when it's AI's turn
  useEffect(() => {
    if (isAITurn() && !isAIThinking && Object.keys(possibleMoves).length > 0) {
      const delay = Math.random() * 500 + 200; // Random delay 200-700ms
      aiTimeoutRef.current = setTimeout(makeAIMove, delay);
    }

    return () => {
      if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current);
      }
    };
  }, [isAITurn, isAIThinking, possibleMoves, makeAIMove]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current);
      }
    };
  }, []);

  // Manual trigger for AI move (for testing or forced moves)
  const triggerAIMove = useCallback(() => {
    if (!isAIThinking) {
      makeAIMove();
    }
  }, [makeAIMove, isAIThinking]);

  return {
    isAIEnabled,
    isAIThinking,
    aiLastMove,
    isAITurn: isAITurn(),
    triggerAIMove,
    aiDifficulty,
    aiSide
  };
} 