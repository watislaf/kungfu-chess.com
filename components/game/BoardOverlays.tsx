import { Square as SquareType } from "chess.js";
import { MoveIndicator } from "./MoveIndicator";
import { CaptureEffect } from "./CaptureEffect";
import { PieceGenerationEffect } from "./PieceGenerationEffect";
import { AttackIndicatorLine } from "./AttackIndicatorLine";
import { AttackIndicator } from "./AttackIndicator";
import { GameState } from "@/app/models/Game";

interface BoardOverlaysProps {
  lastMoveIndicator: {from: SquareType, to: SquareType} | null;
  captureEffect: {square: SquareType, timestamp: number} | null;
  pieceGenerationEffects: Array<{square: SquareType, id: string}>;
  attackIndicators: Array<{from: SquareType, to: SquareType, id: string}>;
  gameState: GameState & { board: (any[] | null)[] };
  playerSide: "white" | "black";
  onEffectComplete: (effectId: string) => void;
}

export function BoardOverlays({
  lastMoveIndicator,
  captureEffect,
  pieceGenerationEffects,
  attackIndicators,
  gameState,
  playerSide,
  onEffectComplete,
}: BoardOverlaysProps) {
  return (
    <div 
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{
        // Ensure all effects are contained and don't affect layout
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 20,
      }}
    >
      {/* Move Indicator */}
      {lastMoveIndicator && (
        <div className="absolute inset-0 pointer-events-none">
          <MoveIndicator 
            from={lastMoveIndicator.from} 
            to={lastMoveIndicator.to}
            playerSide={playerSide}
          />
        </div>
      )}
      
      {/* Capture Effect */}
      {captureEffect && (
        <div className="absolute inset-0 pointer-events-none">
          <CaptureEffect 
            square={captureEffect.square}
            playerSide={playerSide}
          />
        </div>
      )}
      
      {/* Piece Generation Effects */}
      {pieceGenerationEffects.map(effect => (
        <div key={effect.id} className="absolute inset-0 pointer-events-none">
          <PieceGenerationEffect 
            square={effect.square}
            playerSide={playerSide}
            onComplete={() => onEffectComplete(effect.id)}
          />
        </div>
      ))}
      
      {/* Attack Indicator Lines */}
      {attackIndicators.map(attack => (
        <div key={attack.id} className={`absolute inset-0 pointer-events-none ${playerSide === "black" ? "rotate-180" : ""}`}>
          <AttackIndicatorLine 
            from={attack.from}
            to={attack.to}
            playerSide={playerSide}
          />
        </div>
      ))}
      
      {/* Check Attack Indicators */}
      {gameState.check && gameState.check.checkingPieces.length > 0 && (
        <>
          {gameState.check.checkingPieces.map((attackingPiece, index) => {
            // Find the king position
            let kingSquare: SquareType | null = null;
            for (let row = 0; row < 8; row++) {
              for (let col = 0; col < 8; col++) {
                const piece = gameState.board[row]?.[col];
                if (piece && piece.type === 'k') {
                  const isWhiteKing = piece.color === 'w';
                  const isBlackKing = piece.color === 'b';
                  const checkState = gameState.check;
                  if (checkState && ((isWhiteKing && checkState.whiteInCheck) || 
                      (isBlackKing && checkState.blackInCheck))) {
                    const file = String.fromCharCode(97 + col);
                    const rank = 8 - row;
                    kingSquare = `${file}${rank}` as SquareType;
                    break;
                  }
                }
              }
              if (kingSquare) break;
            }
            
            if (kingSquare) {
              return (
                <div key={`attack-${index}`} className={`absolute inset-0 pointer-events-none ${playerSide === "black" ? "rotate-180" : ""}`}>
                  <AttackIndicator 
                    from={attackingPiece.square}
                    to={kingSquare}
                    playerSide={playerSide}
                  />
                </div>
              );
            }
            return null;
          })}
        </>
      )}
    </div>
  );
} 