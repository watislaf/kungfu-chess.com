"use client";

import { PlayerProfile as PlayerProfileType, getTitleColor } from "@/app/models/Player";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trophy, Crown, Target, Calendar, TrendingUp, TrendingDown, Minus, LogOut } from "lucide-react";

interface PlayerProfileProps {
  player: PlayerProfileType;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export function PlayerProfile({ player, isOpen, onClose, onLogout }: PlayerProfileProps) {
  const winRate = player.gamesPlayed > 0 ? ((player.wins / player.gamesPlayed) * 100).toFixed(1) : "0.0";

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-gray-900 border-gray-800 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold text-white flex items-center justify-center gap-2">
            <Crown className="h-6 w-6 text-yellow-500" />
            Player Profile
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Player Info */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                    {player.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{player.displayName}</h3>
                    <p className="text-sm text-gray-400">@{player.username}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onLogout}
                  className="bg-red-900/20 border-red-900/50 text-red-400 hover:bg-red-900/40"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Logout
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Rank and Title */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <span className="text-white font-medium">Rank:</span>
                  <Badge variant="outline" className="bg-yellow-900/20 border-yellow-900/50 text-yellow-400">
                    {player.rank} ELO
                  </Badge>
                </div>
                <Badge className={`${getTitleColor(player.title)} border-current bg-current/10`}>
                  {player.title}
                </Badge>
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

          {/* Recent Games */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="h-5 w-5" />
                Recent Games
              </CardTitle>
            </CardHeader>
            <CardContent>
              {player.gameHistory.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {player.gameHistory.slice(0, 10).map((game, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-900/50 rounded">
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
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
} 