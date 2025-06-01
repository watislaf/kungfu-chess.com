"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { GameState } from "@/app/models/Game";

interface EndGameProps {
  gameState: GameState;
  playerId: string;
  onRestartGame?: () => void;
  onBackToHome?: () => void;
}

export function EndGame({ gameState, playerId, onRestartGame, onBackToHome }: EndGameProps) {
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
      case 'disconnection':
        return 'Player disconnected!';
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
    if (isDraw) return "bg-yellow-100 border-yellow-500 text-yellow-900";
    return isWinner ? "bg-green-100 border-green-500 text-green-900" : "bg-red-100 border-red-500 text-red-900";
  };

  const getResultIcon = () => {
    if (isDraw) return "🤝";
    return isWinner ? "🎉" : "😔";
  };

  const handleNewGame = () => {
    if (onRestartGame) {
      onRestartGame();
    }
  };

  const handleBackToHome = () => {
    if (onBackToHome) {
      onBackToHome();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className={`w-full max-w-md ${getResultColor()} border-2`}>
        <CardHeader className="text-center">
          <div className="text-6xl mb-2">{getResultIcon()}</div>
          <CardTitle className="text-2xl">
            {getResultText()}
          </CardTitle>
          <Badge 
            variant="outline" 
            className={`mx-auto ${
              isDraw 
                ? "border-yellow-600 text-yellow-800 bg-yellow-50" 
                : isWinner 
                ? "border-green-600 text-green-800 bg-green-50" 
                : "border-red-600 text-red-800 bg-red-50"
            }`}
          >
            {getEndReasonText()}
          </Badge>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Game Summary */}
          <div className={`rounded-lg p-4 space-y-2 border ${
            isDraw 
              ? "bg-yellow-50 border-yellow-300 text-yellow-900" 
              : isWinner 
              ? "bg-green-50 border-green-300 text-green-900" 
              : "bg-red-50 border-red-300 text-red-900"
          }`}>
            <div className="text-sm text-center font-medium opacity-90">Game Summary</div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Badge variant={player?.side === "white" ? "default" : "secondary"}>
                  {player?.side === "white" ? "♔" : "♚"} You
                </Badge>
                {player?.name && (
                  <span className="text-sm opacity-80">({player.name})</span>
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
                  <span className="text-sm opacity-80">({opponent.name})</span>
                )}
              </div>
              <div className="text-lg font-bold">
                {!isWinner && !isDraw ? "1" : isDraw ? "½" : "0"}
              </div>
            </div>
            
            <div className="text-xs text-center pt-2 opacity-75">
              Moves played: {gameState.moveHistory.length}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleNewGame}
              className="flex-1"
              size="lg"
            >
              🔄 New Game
            </Button>
            <Button
              onClick={handleBackToHome}
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