"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trophy, Target, Calendar, TrendingUp, TrendingDown, Minus, Crown, Github, Medal, Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSocket } from "@/lib/hooks/useSocket";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTipPrompt } from "@/lib/hooks/useTipPrompt";
import { getTitleColor } from "@/app/models/Player";
import { TipModal } from "@/components/ui/TipModal";

export default function GameHistoryPage() {
  const router = useRouter();
  const { socket } = useSocket();
  const auth = useAuth({ socket });
  const tipPrompt = useTipPrompt();

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'win': return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'loss': return <TrendingDown className="h-3 w-3 text-red-500" />;
      case 'draw': return <Minus className="h-3 w-3 text-yellow-500" />;
      default: return null;
    }
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'win': return 'text-green-400 bg-green-900/20 border-green-900/50';
      case 'loss': return 'text-red-400 bg-red-900/20 border-red-900/50';
      case 'draw': return 'text-yellow-400 bg-yellow-900/20 border-yellow-900/50';
      default: return 'text-gray-400 bg-gray-900/20 border-gray-900/50';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openGitHubRepo = () => {
    window.open('https://github.com/watislaf/kungfu-chess.com', '_blank');
  };

  if (!auth.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="mb-8">
              <Crown className="h-24 w-24 text-yellow-500 mx-auto mb-4" />
              <h1 className="text-4xl font-bold text-white mb-4">Game History</h1>
              <p className="text-xl text-gray-300">
                Please login to view your game history and statistics
              </p>
            </div>
            
            <div className="flex justify-center gap-4">
              <Button
                onClick={() => router.push('/')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go to Home & Login
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const player = auth.player;
  if (!player) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const winRate = player.gamesPlayed > 0 ? ((player.wins / player.gamesPlayed) * 100).toFixed(1) : "0.0";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Fixed buttons */}
      <div className="fixed bottom-4 right-4 z-50 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={openGitHubRepo}
          className="bg-gray-800/80 border-gray-700 text-gray-300 hover:bg-gray-700/80 backdrop-blur-sm"
        >
          <Github className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
          <span className="hidden sm:inline">View Source</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={tipPrompt.openPrompt}
          className="bg-red-900/20 border-red-900/50 text-red-400 hover:bg-red-900/40 backdrop-blur-sm"
        >
          <Heart className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
          <span className="hidden sm:inline">Tip</span>
        </Button>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push('/')}
              className="bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700/50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white flex items-center gap-3">
                <Trophy className="h-8 w-8 text-yellow-500" />
                Game History
              </h1>
              <p className="text-gray-300 mt-1">Your chess journey and statistics</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Player Profile */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                  {player.displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span>{player.displayName}</span>
                    <Badge className={`${getTitleColor(player.title)} border-current bg-current/10 text-xs`}>
                      {player.title}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-400 font-normal">@{player.username}</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Rank and Title */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <span className="text-white font-medium">Rank:</span>
                  <Badge variant="outline" className="bg-yellow-900/20 border-yellow-900/50 text-yellow-400">
                    {player.rank} ELO
                  </Badge>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="bg-gray-900/50 p-3 rounded">
                  <div className="text-lg font-bold text-white">{player.gamesPlayed}</div>
                  <div className="text-xs text-gray-400">Games</div>
                </div>
                <div className="bg-gray-900/50 p-3 rounded">
                  <div className="text-lg font-bold text-green-400">{player.wins}</div>
                  <div className="text-xs text-gray-400">Wins</div>
                </div>
                <div className="bg-gray-900/50 p-3 rounded">
                  <div className="text-lg font-bold text-red-400">{player.losses}</div>
                  <div className="text-xs text-gray-400">Losses</div>
                </div>
                <div className="bg-gray-900/50 p-3 rounded">
                  <div className="text-lg font-bold text-blue-400">{winRate}%</div>
                  <div className="text-xs text-gray-400">Win Rate</div>
                </div>
              </div>

              {/* Member since */}
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Calendar className="h-4 w-4" />
                <span>Member since {new Date(player.createdAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long' 
                })}</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-500" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => router.push('/')}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                Play New Game
              </Button>
              <Button
                onClick={auth.openProfileModal}
                variant="outline"
                className="w-full bg-blue-900/20 border-blue-900/50 text-blue-400 hover:bg-blue-900/40"
              >
                Edit Profile
              </Button>
              <Button
                onClick={auth.logout}
                variant="outline"
                className="w-full bg-red-900/20 border-red-900/50 text-red-400 hover:bg-red-900/40"
              >
                Logout
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Games */}
        <Card className="bg-gray-800/50 border-gray-700 mt-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Target className="h-5 w-5" />
              Recent Games
            </CardTitle>
          </CardHeader>
          <CardContent>
            {player.gameHistory && player.gameHistory.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {player.gameHistory.slice(0, 20).map((game, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-900/50 rounded">
                    <div className="flex items-center gap-3">
                      {getResultIcon(game.result)}
                      <div>
                        <div className="text-sm text-white font-medium">
                          vs {game.opponentUsername}
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatDate(game.playedAt)} • {game.gameEndReason}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm px-2 py-1 rounded border ${getResultColor(game.result)}`}>
                        {game.result.toUpperCase()}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {game.rankChange > 0 ? '+' : ''}{game.rankChange} ELO
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No games played yet</p>
                <p className="text-sm">Start playing to build your history!</p>
                <Button
                  onClick={() => router.push('/')}
                  className="mt-4 bg-green-600 hover:bg-green-700 text-white"
                >
                  Play Your First Game
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      {auth.player && auth.isProfileModalOpen && (
        <div>
          {/* ProfileModal would be rendered here */}
        </div>
      )}

      <TipModal
        isOpen={tipPrompt.isPromptOpen}
        onClose={tipPrompt.closePrompt}
        onTipped={tipPrompt.onUserTipped}
      />
    </div>
  );
} 