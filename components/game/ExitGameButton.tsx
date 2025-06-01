import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Flag } from "lucide-react";

interface ExitGameButtonProps {
  onSurrender?: () => void;
  gameStatus: string;
}

export const ExitGameButton: React.FC<ExitGameButtonProps> = ({ 
  onSurrender,
  gameStatus 
}) => {
  const [isSurrenderOpen, setIsSurrenderOpen] = useState(false);

  const handleSurrender = () => {
    if (onSurrender) {
      onSurrender();
    }
    setIsSurrenderOpen(false);
  };

  // Show surrender button only when game is playing
  const showSurrender = (gameStatus === 'playing') && onSurrender;

  if (!showSurrender) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <Dialog open={isSurrenderOpen} onOpenChange={setIsSurrenderOpen}>
        <DialogTrigger asChild>
          <Button
            variant="destructive"
            size="sm"
            className="h-8 w-8 p-0 rounded-full bg-red-600 hover:bg-red-700 border-2 border-red-800 shadow-lg"
          >
            <Flag className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Surrender Game</DialogTitle>
            <DialogDescription>
              Are you sure you want to surrender? This will end the game and declare your opponent the winner.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSurrenderOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleSurrender}>
              Surrender
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 