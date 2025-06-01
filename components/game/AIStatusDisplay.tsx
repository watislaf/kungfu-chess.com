"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Brain, Target, Zap } from "lucide-react";
import { AIMove } from "@/lib/ai/ChessAI";

interface AIStatusDisplayProps {
  isAIEnabled: boolean;
  isAIThinking: boolean;
  aiSide: 'white' | 'black';
  aiDifficulty: 'easy' | 'medium' | 'hard';
  aiLastMove: AIMove | null;
  isAITurn: boolean;
}

export function AIStatusDisplay({
  isAIEnabled,
  isAIThinking,
  aiSide,
  aiDifficulty,
  aiLastMove,
  isAITurn
}: AIStatusDisplayProps) {
  if (!isAIEnabled) {
    return null;
  }

  const difficultyIcons = {
    'easy': Zap,
    'medium': Brain,
    'hard': Target
  };

  const difficultyColors = {
    'easy': 'text-green-500',
    'medium': 'text-yellow-500',
    'hard': 'text-red-500'
  };

  const DifficultyIcon = difficultyIcons[aiDifficulty];

  return (
    <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
      <CardHeader className="pb-2 px-3 pt-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Bot className="h-4 w-4 text-blue-600" />
          <span>AI Player</span>
          <Badge variant="outline" className="text-xs">
            <DifficultyIcon className={`h-3 w-3 mr-1 ${difficultyColors[aiDifficulty]}`} />
            {aiDifficulty.toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 px-3 pb-3">
        {/* AI Status */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Playing as:</span>
          <Badge variant="secondary" className="text-xs">
            {aiSide === 'white' ? '⚪ White' : '⚫ Black'}
          </Badge>
        </div>

        {/* Current Status */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Status:</span>
          <div className="flex items-center gap-1">
            {isAIThinking && (
              <div className="flex items-center gap-1 text-yellow-600">
                <Brain className="h-3 w-3 animate-pulse" />
                <span>Thinking...</span>
              </div>
            )}
            {!isAIThinking && isAITurn && (
              <div className="flex items-center gap-1 text-blue-600">
                <Bot className="h-3 w-3" />
                <span>Ready</span>
              </div>
            )}
            {!isAIThinking && !isAITurn && (
              <div className="flex items-center gap-1 text-gray-500">
                <Bot className="h-3 w-3" />
                <span>Waiting</span>
              </div>
            )}
          </div>
        </div>

        {/* Last Move */}
        {aiLastMove && (
          <div className="space-y-1 p-2 rounded bg-blue-100/50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-800/50">
            <div className="text-xs font-medium text-blue-700 dark:text-blue-400">
              Last AI Move:
            </div>
            <div className="text-xs text-muted-foreground">
              {aiLastMove.from} → {aiLastMove.to}
            </div>
            <div className="text-xs text-muted-foreground italic">
              {aiLastMove.reasoning}
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400">
              Score: {aiLastMove.score.toFixed(1)}
            </div>
          </div>
        )}

        {/* AI Features Info */}
        {!aiLastMove && (
          <div className="text-xs text-muted-foreground space-y-1">
            <div>🎯 Analyzes special game rules</div>
            <div>🛡️ Prioritizes king safety</div>
            <div>⚔️ Tactical piece positioning</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 