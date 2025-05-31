"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { GameState } from "@/app/models/Game";

interface EndGameProps {
  gameState: GameState;
  playerId: string;
  onNewGame: () => void;
}

export function EndGame({ gameState, playerId, onNewGame }: EndGameProps) {
  const player = gameState.players.find(p => p.id === playerId);
  const opponent = gameState.players.find(p => p.id !== playerId);
  const isWinner = gameState.winner === playerId;
  const isDraw = !gameState.winner;

  const getEndReasonText = () => {
    switch (gameState.gameEndReason) {
      case 'king-captured':
        return 'King captured!';
      case 'checkmate':
        return 'Checkmate!';
      case 'stalemate':
        return 'Stalemate!';
      case 'draw':
        return 'Draw!';
      case 'resignation':
        return 'Resignation!';
      default:
        return 'Game over!';
    }
  };

  const getResultText = () => {
    if (isDraw) {
      return "It's a draw!";
    }
    return isWinner ? "You win!" : "You lose!";
  };

  const getResultColor = () => {
    if (isDraw) return "bg-yellow-100 border-yellow-300";
    return isWinner ? "bg-green-100 border-green-300" : "bg-red-100 border-red-300";
  };

  const getResultIcon = () => {
    if (isDraw) return "🤝";
    return isWinner ? "🎉" : "😔";
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className={`w-full max-w-md ${getResultColor()} border-2`}>
        <CardHeader className="text-center">
          <div className="text-6xl mb-2">{getResultIcon()}</div>
          <CardTitle className="text-2xl">
            {getResultText()}
          </CardTitle>
          <Badge variant="outline" className="mx-auto">
            {getEndReasonText()}
          </Badge>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Game Summary */}
          <div className="bg-white/50 rounded-lg p-4 space-y-2">
            <div className="text-sm text-gray-600 text-center">Game Summary</div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Badge variant={player?.side === "white" ? "default" : "secondary"}>
                  {player?.side === "white" ? "♔" : "♚"} You
                </Badge>
                {player?.name && (
                  <span className="text-sm text-gray-600">({player.name})</span>
                )}
              </div>
              <div className="text-lg font-bold">
                {isWinner ? "1" : isDraw ? "½" : "0"}
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Badge variant={opponent?.side === "white" ? "default" : "secondary"}>
                  {opponent?.side === "white" ? "♔" : "♚"} Opponent
                </Badge>
                {opponent?.name && (
                  <span className="text-sm text-gray-600">({opponent.name})</span>
                )}
              </div>
              <div className="text-lg font-bold">
                {!isWinner && !isDraw ? "1" : isDraw ? "½" : "0"}
              </div>
            </div>
            
            <div className="text-xs text-gray-500 text-center pt-2">
              Moves played: {gameState.moveHistory.length}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={onNewGame}
              className="flex-1"
              size="lg"
            >
              🔄 New Game
            </Button>
            <Button
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              🏠 Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 