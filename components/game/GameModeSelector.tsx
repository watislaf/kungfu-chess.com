"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Users, Bot, Zap, Brain, Target, ChevronDown } from "lucide-react";

export interface GameModeConfig {
  mode: 'pvp' | 'ai';
  aiDifficulty?: 'easy' | 'medium' | 'hard';
  aiSide?: 'white' | 'black';
}

interface GameModeSelectorProps {
  onModeSelect: (config: GameModeConfig) => void;
  disabled?: boolean;
}

export function GameModeSelector({ onModeSelect, disabled = false }: GameModeSelectorProps) {
  const [selectedMode, setSelectedMode] = useState<'pvp' | 'ai'>('pvp');
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [aiSide, setAiSide] = useState<'white' | 'black'>('black');

  const handleModeChange = (mode: 'pvp' | 'ai') => {
    setSelectedMode(mode);
    
    if (mode === 'pvp') {
      onModeSelect({ mode: 'pvp' });
    } else {
      onModeSelect({ 
        mode: 'ai', 
        aiDifficulty, 
        aiSide 
      });
    }
  };

  const handleAIConfigChange = () => {
    if (selectedMode === 'ai') {
      onModeSelect({ 
        mode: 'ai', 
        aiDifficulty, 
        aiSide 
      });
    }
  };

  const difficultyOptions = [
    { value: 'easy', label: 'Easy', icon: Zap, color: 'text-green-500' },
    { value: 'medium', label: 'Medium', icon: Brain, color: 'text-yellow-500' },
    { value: 'hard', label: 'Hard', icon: Target, color: 'text-red-500' }
  ];

  const sideOptions = [
    { value: 'white', label: 'White' },
    { value: 'black', label: 'Black' }
  ];

  return (
    <Card className="rounded-lg sm:rounded-xl">
      <CardHeader className="pb-2 px-3 sm:px-4 pt-3">
        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span>Game Mode</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-3 sm:px-4 pb-3">
        {/* Mode Selection */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={selectedMode === 'pvp' ? 'default' : 'outline'}
            onClick={() => handleModeChange('pvp')}
            disabled={disabled}
            className="h-12 flex flex-col items-center justify-center gap-1 text-xs"
          >
            <Users className="h-4 w-4" />
            <span>vs Player</span>
          </Button>
          
          <Button
            variant={selectedMode === 'ai' ? 'default' : 'outline'}
            onClick={() => handleModeChange('ai')}
            disabled={disabled}
            className="h-12 flex flex-col items-center justify-center gap-1 text-xs"
          >
            <Bot className="h-4 w-4" />
            <span>vs AI</span>
          </Button>
        </div>

        {/* AI Configuration */}
        {selectedMode === 'ai' && (
          <div className="space-y-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border">
            <div className="text-xs font-medium text-center mb-2 flex items-center justify-center gap-1">
              <Bot className="h-3 w-3" />
              AI Configuration
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {/* AI Difficulty */}
              <div className="space-y-2">
                <Label className="text-xs">Difficulty</Label>
                <div className="grid grid-cols-1 gap-1">
                  {difficultyOptions.map((option) => {
                    const IconComponent = option.icon;
                    return (
                      <Button
                        key={option.value}
                        variant={aiDifficulty === option.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setAiDifficulty(option.value as 'easy' | 'medium' | 'hard');
                          setTimeout(handleAIConfigChange, 0);
                        }}
                        disabled={disabled}
                        className="h-8 justify-start text-xs"
                      >
                        <IconComponent className={`h-3 w-3 mr-2 ${option.color}`} />
                        {option.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* AI Side */}
              <div className="space-y-2">
                <Label className="text-xs">AI Plays</Label>
                <div className="grid grid-cols-1 gap-1">
                  {sideOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant={aiSide === option.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setAiSide(option.value as 'white' | 'black');
                        setTimeout(handleAIConfigChange, 0);
                      }}
                      disabled={disabled}
                      className="h-8 justify-start text-xs"
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Info */}
            <div className="text-xs text-muted-foreground text-center">
              AI will analyze board position and special rules
            </div>
          </div>
        )}

        {/* Mode Description */}
        <div className="text-xs text-muted-foreground text-center">
          {selectedMode === 'pvp' 
            ? "Play against another human player online"
            : `Play against AI on ${aiDifficulty} difficulty`
          }
        </div>
      </CardContent>
    </Card>
  );
} 