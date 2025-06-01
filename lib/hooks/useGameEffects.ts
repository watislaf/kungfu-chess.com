import { useState, useEffect, useCallback } from "react";
import { Square as SquareType } from "chess.js";
import { GameState } from "@/app/models/Game";

interface UseGameEffectsProps {
  gameState: GameState & { board: (any[] | null)[] };
}

export function useGameEffects({ gameState }: UseGameEffectsProps) {
  const [lastMoveIndicator, setLastMoveIndicator] = useState<{from: SquareType, to: SquareType} | null>(null);
  const [captureEffect, setCaptureEffect] = useState<{square: SquareType, timestamp: number} | null>(null);
  const [pieceGenerationEffects, setPieceGenerationEffects] = useState<Array<{square: SquareType, id: string}>>([]);
  const [previousBoard, setPreviousBoard] = useState<(any[] | null)[]>([]);
  const [attackIndicators, setAttackIndicators] = useState<Array<{from: SquareType, to: SquareType, id: string}>>([]);
  const [shakingSquares, setShakingSquares] = useState<Set<SquareType>>(new Set());
  const [damageShakingSquares, setDamageShakingSquares] = useState<Set<SquareType>>(new Set());

  // Track pieces that lose hit points for damage shake animation
  useEffect(() => {
    if (gameState.settings?.enableHitPointsSystem && gameState.board && previousBoard.length > 0) {
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const currentPiece = gameState.board[row]?.[col];
          const previousPiece = previousBoard[row]?.[col];
          
          if (currentPiece && previousPiece && 
              currentPiece.type === previousPiece.type && 
              currentPiece.color === previousPiece.color) {
            
            const currentHP = currentPiece.hitPoints ?? 3;
            const previousHP = previousPiece.hitPoints ?? 3;
            
            // If hit points decreased, trigger damage shake
            if (currentHP < previousHP) {
              const file = String.fromCharCode(97 + col);
              const rank = 8 - row;
              const square = `${file}${rank}` as SquareType;
              
              console.log('💥 HP damage detected! Square:', square, 'HP:', previousHP, '->', currentHP);
              
              setDamageShakingSquares(prev => new Set([...prev, square]));
              
              // Remove damage shake after animation completes
              setTimeout(() => {
                setDamageShakingSquares(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(square);
                  return newSet;
                });
              }, 400); // Match animation duration
            }
          }
        }
      }
    }
  }, [gameState.board, gameState.settings?.enableHitPointsSystem]);

  // Track last move for visual indication
  useEffect(() => {
    const lastMove = gameState.moveHistory[gameState.moveHistory.length - 1];
    if (lastMove) {
      console.log('🎯 New move detected:', lastMove);
      
      // Only show move indicator if the piece actually moved
      if (lastMove.from !== lastMove.to) {
        setLastMoveIndicator({ from: lastMove.from, to: lastMove.to });
        setTimeout(() => setLastMoveIndicator(null), 4000);
      }
      
      // Check if this move was an attack
      if (lastMove.attackTarget && gameState.settings?.enableHitPointsSystem) {
        console.log('⚔️ Attack detected! From:', lastMove.from, 'to:', lastMove.attackTarget);
        
        const attackId = Math.random().toString(36).substring(2, 15);
        setAttackIndicators(prev => [...prev, { 
          from: lastMove.from, 
          to: lastMove.attackTarget!, 
          id: attackId 
        }]);
        
        setShakingSquares(prev => new Set([...prev, lastMove.attackTarget!]));
        
        setTimeout(() => {
          setAttackIndicators(prev => prev.filter(attack => attack.id !== attackId));
        }, 1500);
        
        setTimeout(() => {
          setShakingSquares(prev => {
            const newSet = new Set(prev);
            newSet.delete(lastMove.attackTarget!);
            return newSet;
          });
        }, 600);
      }
      
      // Check if this move was a capture
      if (lastMove.captured) {
        console.log('💥 Capture detected! Starting particle effect on square:', lastMove.to);
        setCaptureEffect({ square: lastMove.to, timestamp: Date.now() });
        setTimeout(() => setCaptureEffect(null), 1500);
      }
    }
  }, [gameState.moveHistory, gameState.settings?.enableHitPointsSystem]);

  // Detect new piece generation for particle effects
  useEffect(() => {
    if (gameState.settings?.enableRandomPieceGeneration && gameState.board && previousBoard.length > 0) {
      const rookSquares: SquareType[] = ['a1', 'h1', 'a8', 'h8'];
      
      rookSquares.forEach(square => {
        const [row, col] = [8 - parseInt(square[1]), square.charCodeAt(0) - 97];
        const currentPiece = gameState.board[row]?.[col];
        const previousPiece = previousBoard[row]?.[col];
        
        if (currentPiece && !previousPiece) {
          console.log('✨ New piece generated at:', square, currentPiece);
          const effectId = Math.random().toString(36).substring(2, 15);
          setPieceGenerationEffects(prev => [...prev, { square, id: effectId }]);
        }
      });
    }
    
    // Always update previousBoard when gameState.board changes
    setPreviousBoard(gameState.board || []);
  }, [gameState.board, gameState.settings?.enableRandomPieceGeneration]);

  // Clear capture effect when it expires
  useEffect(() => {
    if (captureEffect) {
      const timeLeft = 1500 - (Date.now() - captureEffect.timestamp);
      if (timeLeft > 0) {
        const timer = setTimeout(() => setCaptureEffect(null), timeLeft);
        return () => clearTimeout(timer);
      } else {
        setCaptureEffect(null);
      }
    }
  }, [captureEffect]);

  const handleEffectComplete = useCallback((effectId: string) => {
    setPieceGenerationEffects(prev => prev.filter(effect => effect.id !== effectId));
  }, []);

  return {
    lastMoveIndicator,
    captureEffect,
    pieceGenerationEffects,
    attackIndicators,
    shakingSquares,
    damageShakingSquares,
    handleEffectComplete,
  };
} 