"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface BoardTheme {
  id: string;
  name: string;
  lightSquare: string;
  darkSquare: string;
  lightSquareHover: string;
  darkSquareHover: string;
}

export interface PieceTheme {
  id: string;
  name: string;
  description: string;
}

const BOARD_THEMES: BoardTheme[] = [
  {
    id: "classic",
    name: "Classic",
    lightSquare: "bg-gradient-to-br from-green-50 via-green-100 to-green-200 border border-green-300/50",
    darkSquare: "bg-gradient-to-br from-green-600 via-green-700 to-green-800 border border-green-500/50",
    lightSquareHover: "hover:from-green-100 hover:via-green-150 hover:to-green-250",
    darkSquareHover: "hover:from-green-550 hover:via-green-650 hover:to-green-750",
  },
  {
    id: "wooden",
    name: "Wooden",
    lightSquare: "bg-gradient-to-br from-amber-50 via-amber-100 to-amber-200 border border-amber-300/50",
    darkSquare: "bg-gradient-to-br from-amber-700 via-amber-800 to-amber-900 border border-amber-600/50",
    lightSquareHover: "hover:from-amber-100 hover:via-amber-150 hover:to-amber-250",
    darkSquareHover: "hover:from-amber-650 hover:via-amber-750 hover:to-amber-850",
  },
  {
    id: "blue",
    name: "Ocean",
    lightSquare: "bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 border border-blue-300/50",
    darkSquare: "bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 border border-blue-500/50",
    lightSquareHover: "hover:from-blue-100 hover:via-blue-150 hover:to-blue-250",
    darkSquareHover: "hover:from-blue-550 hover:via-blue-650 hover:to-blue-750",
  },
  {
    id: "purple",
    name: "Royal",
    lightSquare: "bg-gradient-to-br from-purple-50 via-purple-100 to-purple-200 border border-purple-300/50",
    darkSquare: "bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 border border-purple-500/50",
    lightSquareHover: "hover:from-purple-100 hover:via-purple-150 hover:to-purple-250",
    darkSquareHover: "hover:from-purple-550 hover:via-purple-650 hover:to-purple-750",
  },
  {
    id: "monochrome",
    name: "Classic",
    lightSquare: "bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 border border-gray-400/50",
    darkSquare: "bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 border border-gray-500/50",
    lightSquareHover: "hover:from-gray-150 hover:via-gray-250 hover:to-gray-350",
    darkSquareHover: "hover:from-gray-550 hover:via-gray-650 hover:to-gray-750",
  },
];

const PIECE_THEMES: PieceTheme[] = [
  {
    id: "classic",
    name: "Classic",
    description: "Traditional chess pieces",
  },
  {
    id: "modern",
    name: "Modern",
    description: "War tactics units style",
  },
  {
    id: "bold",
    name: "Bold",
    description: "Strong, heavy shapes",
  },
  {
    id: "elegant",
    name: "Elegant",
    description: "Refined minimalist style",
  },
  {
    id: "minimalist",
    name: "Minimal",
    description: "Ultra-clean simple forms",
  },
];

interface BoardCustomizationProps {
  selectedBoardTheme: string;
  selectedPieceTheme: string;
  onBoardThemeChange: (themeId: string) => void;
  onPieceThemeChange: (themeId: string) => void;
}

export function BoardCustomization({
  selectedBoardTheme,
  selectedPieceTheme,
  onBoardThemeChange,
  onPieceThemeChange,
}: BoardCustomizationProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 rounded-full bg-black/10 hover:bg-black/20 border border-white/20 shadow-sm"
        >
          <Settings className="h-4 w-4 text-white/80" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl bg-gray-900">
        <DialogHeader>
          <DialogTitle className="text-white">Board Customization</DialogTitle>
          <DialogDescription className="text-gray-300">
            Choose your preferred board colors and piece styles
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Board Color Selection */}
          <div>
            <h3 className="text-sm font-medium mb-3 text-white">Board Colors</h3>
            <div className="flex gap-3 justify-center flex-wrap">
              {BOARD_THEMES.map((theme) => (
                <div
                  key={theme.id}
                  className={`flex flex-col items-center cursor-pointer transition-all group ${
                    selectedBoardTheme === theme.id ? "scale-110" : "hover:scale-105"
                  }`}
                  onClick={() => onBoardThemeChange(theme.id)}
                >
                  {/* Board preview with actual theme colors */}
                  <div className={`relative border-2 rounded-lg overflow-hidden ${
                    selectedBoardTheme === theme.id 
                      ? "border-blue-400 shadow-lg shadow-blue-400/30" 
                      : "border-gray-600 group-hover:border-blue-300"
                  }`}>
                    <div className="grid grid-cols-4 gap-0 w-16 h-16">
                      {Array.from({ length: 16 }).map((_, i) => {
                        const row = Math.floor(i / 4);
                        const col = i % 4;
                        const isLight = (row + col) % 2 === 0;
                        return (
                          <div
                            key={i}
                            className={`${isLight ? theme.lightSquare : theme.darkSquare} flex items-center justify-center`}
                          >
                            {/* Show pieces on some squares for better preview */}
                            {i === 1 && <span className="text-xs text-gray-800">♛</span>}
                            {i === 6 && <span className="text-xs text-white">♔</span>}
                            {i === 9 && <span className="text-xs text-gray-800">♟</span>}
                            {i === 14 && <span className="text-xs text-white">♙</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="mt-2 text-center">
                    <div className="text-xs font-medium text-gray-200">{theme.name}</div>
                    {selectedBoardTheme === theme.id && (
                      <Badge variant="default" className="text-xs mt-1 bg-blue-600">Selected</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Piece Style Selection */}
          <div>
            <h3 className="text-sm font-medium mb-3 text-white">Piece Styles</h3>
            <div className="flex gap-4 justify-center flex-wrap">
              {PIECE_THEMES.map((theme) => (
                <div
                  key={theme.id}
                  className={`flex flex-col items-center cursor-pointer transition-all group ${
                    selectedPieceTheme === theme.id ? "scale-110" : "hover:scale-105"
                  }`}
                  onClick={() => onPieceThemeChange(theme.id)}
                >
                  {/* Simplified piece preview with better contrast */}
                  <div className={`w-14 h-14 flex items-center justify-center rounded-lg border-2 ${
                    selectedPieceTheme === theme.id 
                      ? "border-blue-400 bg-gray-700 shadow-lg shadow-blue-400/30" 
                      : "border-gray-600 bg-gray-800 group-hover:border-blue-300 group-hover:bg-gray-700"
                  }`}>
                    <div className="grid grid-cols-2 gap-1">
                      <span className="text-sm text-white">♔</span>
                      <span className="text-sm text-gray-400">♚</span>
                      <span className="text-sm text-white">♙</span>
                      <span className="text-sm text-gray-400">♟</span>
                    </div>
                  </div>
                  
                  <div className="mt-2 text-center">
                    <div className="text-xs font-medium text-gray-200">{theme.name}</div>
                    {selectedPieceTheme === theme.id && (
                      <Badge variant="default" className="text-xs mt-1 bg-blue-600">Selected</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { BOARD_THEMES, PIECE_THEMES }; 