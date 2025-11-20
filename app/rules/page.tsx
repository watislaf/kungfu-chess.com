"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Book, Zap, Crown, Clock, Target, Github, Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTipPrompt } from "@/lib/hooks/useTipPrompt";
import { TipModal } from "@/components/ui/TipModal";

export default function RulesPage() {
  const router = useRouter();
  const tipPrompt = useTipPrompt();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Fixed buttons */}
      <div className="fixed bottom-4 right-4 z-50 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open('https://github.com/watislaf/kungfu-chess.com', '_blank')}
          className="bg-gray-800/80 border-gray-700 text-gray-300 hover:bg-gray-700/80 backdrop-blur-sm"
        >
          <Github className="h-4 w-4 mr-2" />
          View Source
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={tipPrompt.openPrompt}
          className="bg-red-900/20 border-red-900/50 text-red-400 hover:bg-red-900/40 backdrop-blur-sm"
        >
          <Heart className="h-4 w-4 mr-2" />
          Tip
        </Button>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            onClick={() => router.push('/')}
            className="bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700/50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          <div>
            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
              <Book className="h-10 w-10 text-blue-500" />
              Kung Fu Chess Rules
            </h1>
            <p className="text-gray-300 mt-1">Learn how to play simultaneous chess</p>
          </div>
        </div>

        {/* Rules Sections */}
        <div className="space-y-6 max-w-4xl">
          {/* What is Kung Fu Chess */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Book className="h-5 w-5 text-blue-500" />
                What is Kung Fu Chess?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-300">
                Kung Fu Chess is a fast-paced variant of chess where both players move simultaneously in real-time.
                There are no turns - you can move your pieces whenever they're ready, creating an intense and dynamic
                game that tests your speed, strategy, and multitasking abilities.
              </p>
            </CardContent>
          </Card>

          {/* Real-Time Movement */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                1. Pieces Move in Real-Time (No Turns)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-300">
                Unlike traditional chess, you don't wait for your opponent to move. Both players can move their pieces
                at the same time. This means you need to think fast and adapt quickly to your opponent's moves.
              </p>
              <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                <p className="text-gray-400 text-sm">
                  <span className="text-yellow-400 font-semibold">Pro Tip:</span> Keep your eyes on the entire board.
                  Your opponent might be setting up an attack while you're focused on your own strategy.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Cooldown System */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-500" />
                2. After Moving, a Piece Has a Cooldown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-300">
                After you move a piece, it enters a cooldown period and cannot be moved again immediately.
                This prevents you from rapidly moving the same piece over and over.
              </p>
              <div className="space-y-2">
                <p className="text-gray-300">
                  <span className="text-white font-semibold">Cooldown Duration:</span> Each piece type has its own cooldown time:
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-400 ml-4">
                  <li><Badge variant="outline" className="mr-2 text-xs">Pawn</Badge> Short cooldown</li>
                  <li><Badge variant="outline" className="mr-2 text-xs">Knight</Badge> Medium cooldown</li>
                  <li><Badge variant="outline" className="mr-2 text-xs">Bishop</Badge> Medium cooldown</li>
                  <li><Badge variant="outline" className="mr-2 text-xs">Rook</Badge> Longer cooldown</li>
                  <li><Badge variant="outline" className="mr-2 text-xs">Queen</Badge> Longest cooldown</li>
                  <li><Badge variant="outline" className="mr-2 text-xs">King</Badge> Medium cooldown</li>
                </ul>
              </div>
              <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                <p className="text-gray-400 text-sm">
                  <span className="text-purple-400 font-semibold">Strategy Tip:</span> While one piece is on cooldown,
                  work on positioning your other pieces. Good players manage multiple pieces at once.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Win Condition */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                3. The Goal is to Checkmate the King
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-300">
                Just like traditional chess, the objective is to checkmate your opponent's king. This means putting
                the king in a position where it is under attack and cannot escape.
              </p>
              <div className="space-y-2">
                <p className="text-white font-semibold">Victory Conditions:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-400 ml-4">
                  <li>Checkmate the opponent's king</li>
                  <li>Capture the opponent's king (if they fail to move it out of danger)</li>
                </ul>
              </div>
              <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                <p className="text-gray-400 text-sm">
                  <span className="text-yellow-400 font-semibold">Remember:</span> In real-time chess, protecting
                  your king is crucial. You can't assume your opponent will wait for you to move it to safety.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Getting Started */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="h-5 w-5 text-green-500" />
                Getting Started
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-300">
                Ready to play? Here's how to get started:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-gray-400 ml-4">
                <li>Click on a piece to select it</li>
                <li>Click on a valid square to move it there</li>
                <li>Watch for the cooldown indicator on your pieces</li>
                <li>Keep moving and attacking to gain an advantage</li>
                <li>Protect your king at all times</li>
              </ol>
              <div className="mt-6">
                <Button
                  onClick={() => router.push('/')}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Start Playing Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <TipModal
        isOpen={tipPrompt.isPromptOpen}
        onClose={tipPrompt.closePrompt}
        onTipped={tipPrompt.onUserTipped}
      />
    </div>
  );
}
