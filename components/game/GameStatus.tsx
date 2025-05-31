"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface GameStatusProps {
  status: "waiting" | "settings" | "playing";
  playerCount?: number;
  currentTurn?: string;
  isMyTurn?: boolean;
  whitePlayerName?: string;
}

export function GameStatus({
  status,
  playerCount = 0,
  currentTurn,
  isMyTurn,
  whitePlayerName,
}: GameStatusProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "waiting":
        return {
          emoji: "⏳",
          text: "Waiting for players...",
          mobileText: "Waiting...",
          bgColor: "bg-yellow-500/5",
          borderColor: "border-yellow-500/50",
          textColor: "text-yellow-400",
        };
      case "settings":
        return {
          emoji: "⚙️",
          text: "Configure game settings",
          mobileText: "Settings",
          bgColor: "bg-blue-500/5",
          borderColor: "border-blue-500/50",
          textColor: "text-blue-400",
        };
      case "playing":
        return {
          emoji: "🎉",
          text: isMyTurn ? "Your turn to move" : `${whitePlayerName}'s turn`,
          mobileText: isMyTurn ? "Your turn" : "Opponent's turn",
          bgColor: "bg-green-500/5",
          borderColor: "border-green-500/50",
          textColor: "text-green-400",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Card
      className={`${config.borderColor} ${config.bgColor} py-1 rounded-lg sm:rounded-xl animate-in slide-in-from-top duration-300`}
    >
      <CardContent>
        <div className="flex items-center justify-center gap-2">
          <span className="text-lg animate-bounce">{config.emoji}</span>
          <span
            className={`text-xs sm:text-sm font-medium ${config.textColor}`}
          >
            <span className="sm:hidden">{config.mobileText}</span>
            <span className="hidden sm:inline">{config.text}</span>
          </span>
          {status === "waiting" && (
            <Badge
              variant="outline"
              className="text-xs rounded-md animate-pulse px-1 py-0"
            >
              {playerCount}/2
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
