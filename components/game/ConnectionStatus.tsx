"use client";

import { Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ConnectionStatusProps {
  isConnected: boolean;
  gameId: string;
}

export function ConnectionStatus({
  isConnected,
  gameId,
}: ConnectionStatusProps) {
  return (
    <div className="flex items-center gap-1 text-xs">
      {isConnected ? (
        <Wifi className="h-2.5 w-2.5 text-green-500" />
      ) : (
        <WifiOff className="h-2.5 w-2.5 text-red-500" />
      )}
      <span className="text-muted-foreground text-xs">
        {isConnected ? "Online" : "Offline"}
      </span>
      <Badge
        variant="outline"
        className="font-mono text-xs px-1 py-0 h-4 rounded-md"
      >
        {gameId.slice(0, 6)}
      </Badge>
    </div>
  );
}
