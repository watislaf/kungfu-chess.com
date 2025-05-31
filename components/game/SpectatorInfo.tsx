"use client";

import { Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SpectatorInfoProps {
  spectatorCount: number;
}

export function SpectatorInfo({ spectatorCount }: SpectatorInfoProps) {
  if (spectatorCount === 0) return null;

  return (
    <div className="flex items-center gap-1 text-xs">
      <Eye className="h-2.5 w-2.5 text-muted-foreground" />
      <Badge variant="outline" className="text-xs px-1 py-0 h-4 rounded-md">
        {spectatorCount} watching
      </Badge>
    </div>
  );
}
