"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Check } from "lucide-react";
import { Player } from "@/app/models/Game";

interface ReadyButtonProps {
  currentPlayer?: Player;
  otherPlayer?: Player;
  bothReady: boolean;
  onReady: () => void;
}

export function ReadyButton({ currentPlayer, otherPlayer, bothReady, onReady }: ReadyButtonProps) {
  const isReady = currentPlayer?.isReady || false;

  return (
    <div className="space-y-2 pt-2 border-t">
      <div className="flex justify-center">
        <Button
          onClick={onReady}
          disabled={isReady}
          size="lg"
          className={`w-full max-w-sm rounded-xl transition-all duration-200 hover:scale-105 h-12 text-base font-medium shadow-lg ${
            isReady ? "bg-green-600 hover:bg-green-600" : "bg-primary hover:bg-primary/90"
          }`}
        >
          {isReady ? (
            <>
              <Check className="mr-2 h-5 w-5" />
              <span>You're Ready!</span>
            </>
          ) : (
            <>
              <Clock className="mr-2 h-5 w-5" />
              <span>I'm Ready!</span>
            </>
          )}
        </Button>
      </div>

      <div className="text-center space-y-1">
        <div className="flex justify-center gap-2 flex-wrap">
          <Badge
            variant={isReady ? "default" : "outline"}
            className={`text-xs rounded-md px-2 py-1 ${isReady ? "bg-green-600" : ""}`}
          >
            {currentPlayer?.name || "You"}: {isReady ? "Ready" : "Not Ready"}
          </Badge>
          <Badge
            variant={otherPlayer?.isReady ? "default" : "outline"}
            className={`text-xs rounded-md px-2 py-1 ${otherPlayer?.isReady ? "bg-green-600" : ""}`}
          >
            {otherPlayer?.name || "Opponent"}: {otherPlayer?.isReady ? "Ready" : "Not Ready"}
          </Badge>
        </div>

        {bothReady && (
          <p className="text-sm text-green-400 font-medium animate-bounce">
            🎉 Both players ready! Starting game...
          </p>
        )}
      </div>
    </div>
  );
}
