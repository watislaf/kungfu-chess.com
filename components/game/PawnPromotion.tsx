"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import PieceSVG from "./PieceSVG";

interface PawnPromotionProps {
  isOpen: boolean;
  playerSide: "white" | "black";
  onSelect: (piece: string) => void;
  isProcessing?: boolean;
}

export function PawnPromotion({ isOpen, playerSide, onSelect, isProcessing = false }: PawnPromotionProps) {
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
  
  const pieces = ['q', 'r', 'b', 'n']; // Queen, Rook, Bishop, Knight
  const pieceNames = {
    q: 'Queen',
    r: 'Rook', 
    b: 'Bishop',
    n: 'Knight'
  };

  const getPieceSymbol = (piece: string) => {
    return playerSide === "white" ? piece.toUpperCase() : piece.toLowerCase();
  };

  const handlePieceSelect = (piece: string) => {
    if (isProcessing || selectedPiece) return;
    
    setSelectedPiece(piece);
    onSelect(piece);
  };

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedPiece(null);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md bg-green-50 border-green-200">
        <DialogHeader>
          <DialogTitle className="text-green-800">Choose promotion piece</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 p-4">
          {pieces.map((piece) => (
            <button
              key={piece}
              onClick={() => handlePieceSelect(piece)}
              disabled={isProcessing || selectedPiece !== null}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all duration-200 group ${
                selectedPiece === piece
                  ? "border-green-600 bg-green-200 ring-2 ring-green-400"
                  : isProcessing || selectedPiece
                  ? "border-green-300 bg-green-100 cursor-not-allowed opacity-50"
                  : "border-green-300 bg-white hover:border-green-500 hover:bg-green-100"
              }`}
            >
              <div className={`w-16 h-16 transition-transform ${
                selectedPiece === piece ? "scale-110" : "group-hover:scale-110"
              }`}>
                <PieceSVG piece={getPieceSymbol(piece)} />
              </div>
              <span className={`text-sm font-medium transition-colors ${
                selectedPiece === piece 
                  ? "text-green-800"
                  : isProcessing || selectedPiece
                  ? "text-green-600"
                  : "text-green-700 group-hover:text-green-800"
              }`}>
                {pieceNames[piece as keyof typeof pieceNames]}
              </span>
              {selectedPiece === piece && (
                <div className="text-xs text-green-700 font-medium">Selected!</div>
              )}
            </button>
          ))}
        </div>
        <div className="text-xs text-center pb-2">
          {isProcessing ? (
            <span className="text-green-700 animate-pulse">Processing selection...</span>
          ) : selectedPiece ? (
            <span className="text-green-700">Selection made!</span>
          ) : (
            <span className="text-green-600">Click on a piece to promote your pawn</span>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 