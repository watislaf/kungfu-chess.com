"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Zap, Trophy, Crown, User, LogIn, Github } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { useSocket } from "@/lib/hooks/useSocket";
import { useAuth } from "@/lib/hooks/useAuth";
import { useChatPrompt } from "@/lib/hooks/useChatPrompt";
import { LoginModal } from "@/components/auth/LoginModal";
import { PlayerProfile } from "@/components/auth/PlayerProfile";
import { ChatModal } from "@/components/ui/ChatModal";
import { getTitleColor } from "@/app/models/Player";
import { getPlayerTitle } from "@/app/models/Player";

export default function HomePage() {
  const [gameId, setGameId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [guestNumber, setGuestNumber] = useState<number | null>(null);
  const [globalStats, setGlobalStats] = useState<{
    activeGames: number;
    playersOnline: number;
    queueSize: number;
    currentlyPlaying: { playerName: string; rank?: number; gameId: string }[];
  }>({
    activeGames: 0,
    playersOnline: 0,
    queueSize: 0,
    currentlyPlaying: []
  });
  
  const { 
    socket,
    isConnected,
    isMatchmaking,
    findRandomPlayer,
    cancelMatchmaking,
    joinGame 
  } = useSocket();

  const auth = useAuth({ socket });
  const chatPrompt = useChatPrompt();

  useEffect(() => {
    // Generate a random game ID on component mount
    setGameId(uuidv4());
    
    // Load or generate guest number for this session
    const savedGuestNumber = sessionStorage.getItem('guestNumber');
    if (savedGuestNumber) {
      setGuestNumber(parseInt(savedGuestNumber));
    } else {
      const newGuestNumber = Math.floor(Math.random() * 999) + 1;
      setGuestNumber(newGuestNumber);
      sessionStorage.setItem('guestNumber', newGuestNumber.toString());
    }
  }, []);

  // Listen for global stats updates
  useEffect(() => {
    if (!socket) return;

    const handleGlobalStats = (stats: typeof globalStats) => {
      setGlobalStats(stats);
    };

    socket.on('global-stats', handleGlobalStats);

    return () => {
      socket.off('global-stats', handleGlobalStats);
    };
  }, [socket]);

  const getEffectivePlayerName = () => {
    if (auth.isAuthenticated) {
      return auth.player?.displayName;
    }
    
    if (playerName.trim()) {
      return playerName.trim();
    }
    
    return `Guest ${guestNumber?.toString().padStart(3, '0') || '001'}`;
  };

  const handleCreateGame = () => {
    const effectivePlayerName = getEffectivePlayerName();
    
    if (gameId.trim()) {
      joinGame(gameId.trim(), effectivePlayerName);
      window.location.href = `/game?id=${encodeURIComponent(gameId.trim())}`;
    }
  };

  const handleFindRandomPlayer = () => {
    const effectivePlayerName = getEffectivePlayerName();
    
    // Create a new game room first
    const newGameId = uuidv4();
    
    // Join the room
    joinGame(newGameId, effectivePlayerName);
    
    // Navigate to the room
    window.location.href = `/game?id=${encodeURIComponent(newGameId)}&autoMatch=true`;
  };

  const handleJoinExistingGame = () => {
    const gameIdToJoin = prompt("Enter Game ID:");
    if (gameIdToJoin?.trim()) {
      const effectivePlayerName = getEffectivePlayerName();
      
      joinGame(gameIdToJoin.trim(), effectivePlayerName);
      window.location.href = `/game?id=${encodeURIComponent(gameIdToJoin.trim())}`;
    }
  };

  const openGitHubRepo = () => {
    // Open GitHub repository (replace with actual repo URL when available)
    window.open('https://github.com/your-username/rapid-chess-online', '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Crown className="h-12 w-12 text-yellow-500" />
            <h1 className="text-5xl font-bold text-white">
              Kung Fu Chess Online
            </h1>
            <Crown className="h-12 w-12 text-yellow-500" />
            {/* GitHub / View Source Button */}
            <div className="absolute top-4 right-4 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={openGitHubRepo}
                className="bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700/50"
              >
                <Github className="h-4 w-4 mr-2" />
                View Source
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={chatPrompt.openPrompt}
                className="bg-red-900/20 border-red-900/50 text-red-400 hover:bg-red-900/40"
              >
                💝 Support
              </Button>
            </div>
          </div>
          <h2 className="text-xl text-gray-300 max-w-2xl mx-auto mb-4">
            Experience revolutionary <strong>simultaneous chess</strong> where both players move at the same time.
            No turns, no waiting - just pure <strong>chess strategy</strong> at lightning speed!
          </h2>
          <div className="text-lg text-blue-300 max-w-3xl mx-auto">
            🚀 <strong>Real-Time Multiplayer Chess Game</strong> • 🏆 <strong>ELO Rankings</strong> • ⚡ <strong>Instant Matchmaking</strong> • 🎯 <strong>Competitive Chess Battles</strong>
          </div>
        </div>

        {/* SEO Content Section */}
        <div className="mb-12 text-center">
          <Card className="bg-gray-800/30 border-gray-700 max-w-4xl mx-auto">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-white mb-4">What is Kung Fu Chess?</h2>
              <div className="text-gray-300 space-y-3 text-left">
                <p>
                  <strong>Kung Fu Chess</strong> (also known as <strong>Real-Time Chess</strong>, <strong>Simultaneous Chess</strong>, or <strong>Rapid Chess</strong>) is a revolutionary chess variant that eliminates the traditional turn-based system. In this exciting <strong>multiplayer chess game</strong>, both players can move their pieces simultaneously, creating intense, fast-paced battles that test your chess tactics and quick decision-making skills.
                </p>
                <p>
                  Unlike traditional chess where you wait for your opponent's move, <strong>Kung Fu Chess Online</strong> lets you execute your chess strategy in real-time. This innovative approach to <strong>online chess</strong> combines classical chess rules with modern <strong>speed chess</strong> mechanics, featuring piece cooldowns, move limits, and strategic timing elements that make every game unique.
                </p>
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div className="bg-blue-900/20 p-4 rounded-lg">
                    <h3 className="text-blue-300 font-semibold mb-2">🏆 Competitive Chess Rankings</h3>
                    <p className="text-sm text-gray-400">
                      Climb the <strong>ELO chess rating</strong> system from Novice (0-999) to Grandmaster (2200+). Track your chess improvement with detailed statistics and game history.
                    </p>
                  </div>
                  <div className="bg-purple-900/20 p-4 rounded-lg">
                    <h3 className="text-purple-300 font-semibold mb-2">⚡ Lightning-Fast Chess Gameplay</h3>
                    <p className="text-sm text-gray-400">
                      Experience the thrill of <strong>instant chess</strong> where strategy meets speed. Perfect for chess players who love fast-paced, adrenaline-pumping matches.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Authentication Section */}
        <div className="flex justify-center mb-8">
          {auth.isAuthenticated && auth.player ? (
            <Card className="bg-gray-800/50 border-gray-700 max-w-md">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                      {auth.player.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{auth.player.displayName}</span>
                        <Badge className={`${getTitleColor(auth.player.title)} border-current bg-current/10 text-xs`}>
                          {auth.player.title}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Trophy className="h-3 w-3" />
                        <span>{auth.player.rank} ELO</span>
                        <span>•</span>
                        <span>{auth.player.wins}W/{auth.player.losses}L</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={auth.openProfileModal}
                    className="bg-blue-900/20 border-blue-900/50 text-blue-400 hover:bg-blue-900/40"
                  >
                    <User className="h-4 w-4 mr-1" />
                    Profile
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = '/history'}
                    className="bg-purple-900/20 border-purple-900/50 text-purple-400 hover:bg-purple-900/40"
                  >
                    <Trophy className="h-4 w-4 mr-1" />
                    History
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-gray-800/50 border-gray-700 max-w-md">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div>
                    <User className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-white mb-1">Welcome, Guest!</h3>
                    <p className="text-sm text-gray-400">Login to track your progress and climb the rankings</p>
                  </div>
                  <Button
                    onClick={auth.openLoginModal}
                    size="lg"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3"
                  >
                    <LogIn className="h-5 w-5 mr-3" />
                    Login / Register
                  </Button>
                  <p className="text-xs text-gray-500">
                    You can play as a guest, but wins/losses won't be tracked
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Game Actions */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Quick Start
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Player Name Input (only show if not authenticated) */}
              {!auth.isAuthenticated && (
                <div className="space-y-2">
                  <label className="text-sm text-gray-300">Your Name (Optional)</label>
                  <Input
                    type="text"
                    placeholder={`Enter your name (or leave empty for ${getEffectivePlayerName()})`}
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="bg-gray-900/50 border-gray-600 text-white"
                  />
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-400">You'll appear as:</span>
                    <Badge variant="outline" className="bg-blue-900/20 border-blue-900/50 text-blue-400">
                      {getEffectivePlayerName()}
                    </Badge>
                  </div>
                </div>
              )}

              {/* Game ID for Creating Room */}
              <div className="space-y-2">
                <label className="text-sm text-gray-300">Room ID</label>
                <Input
                  type="text"
                  placeholder="Auto-generated room ID"
                  value={gameId}
                  onChange={(e) => setGameId(e.target.value)}
                  className="bg-gray-900/50 border-gray-600 text-white"
                />
              </div>

              <div className="grid grid-cols-1 gap-2">
                <Button
                  onClick={handleCreateGame}
                  disabled={!isConnected}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Create Game Room
                </Button>
                
                <Button
                  onClick={handleJoinExistingGame}
                  disabled={!isConnected}
                  variant="outline"
                  className="w-full bg-blue-900/20 border-blue-900/50 text-blue-400 hover:bg-blue-900/40"
                >
                  Join Existing Room
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-600" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-gray-800 px-2 text-gray-400">Or</span>
                </div>
              </div>

              <Button
                onClick={isMatchmaking ? cancelMatchmaking : handleFindRandomPlayer}
                disabled={!isConnected || isMatchmaking}
                variant={isMatchmaking ? "destructive" : "default"}
                className="w-full"
              >
                {!isConnected ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2" />
                    Connecting...
                  </>
                ) : isMatchmaking ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Searching for Opponent...
                  </>
                ) : (
                  <>
                    <Trophy className="mr-2 h-4 w-4" />
                    Find Random Opponent
                  </>
                )}
              </Button>

              {isMatchmaking && (
                <div className="text-center text-sm text-blue-400 animate-pulse">
                  🔍 Looking for players with similar skill level...
                </div>
              )}

              {!isConnected && (
                <div className="text-center text-red-400 text-sm">
                  Connecting to server...
                </div>
              )}
            </CardContent>
          </Card>

          {/* Game Features */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Chess Game Features - Real-Time Multiplayer Chess
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="bg-purple-900/20 border-purple-900/50 text-purple-400">
                    ⚡
                  </Badge>
                  <div>
                    <h3 className="text-white font-medium">Simultaneous Chess Moves</h3>
                    <p className="text-sm text-gray-400">
                      Revolutionary <strong>real-time chess</strong> gameplay - both players move at the same time with no waiting for turns! Experience the most innovative <strong>chess variant</strong> ever created.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="bg-blue-900/20 border-blue-900/50 text-blue-400">
                    🎯
                  </Badge>
                  <div>
                    <h3 className="text-white font-medium">Strategic Move Limits & Cooldowns</h3>
                    <p className="text-sm text-gray-400">
                      Balanced <strong>speed chess</strong> mechanics with limited moves per 10 seconds and piece cooldowns. Perfect blend of <strong>chess strategy</strong> and rapid execution.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="bg-green-900/20 border-green-900/50 text-green-400">
                    🏆
                  </Badge>
                  <div>
                    <h3 className="text-white font-medium">ELO Chess Rating System</h3>
                    <p className="text-sm text-gray-400">
                      <strong>Competitive chess rankings</strong> with ELO rating system. Progress from Novice to Grandmaster in this exciting <strong>online chess game</strong> with skill-based matchmaking.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="bg-red-900/20 border-red-900/50 text-red-400">
                    ❤️
                  </Badge>
                  <div>
                    <h3 className="text-white font-medium">Advanced Chess Game Modes</h3>
                    <p className="text-sm text-gray-400">
                      Unique features like Hit Points system and Random piece generation add exciting twists to traditional <strong>chess tactics</strong> and <strong>chess gameplay</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="bg-yellow-900/20 border-yellow-900/50 text-yellow-400">
                    🌐
                  </Badge>
                  <div>
                    <h3 className="text-white font-medium">Global Chess Community</h3>
                    <p className="text-sm text-gray-400">
                      Play <strong>chess with friends</strong> or find random opponents worldwide. Join the growing community of <strong>real-time chess</strong> enthusiasts and <strong>competitive chess</strong> players.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="bg-indigo-900/20 border-indigo-900/50 text-indigo-400">
                    📱
                  </Badge>
                  <div>
                    <h3 className="text-white font-medium">Mobile-Friendly Chess Experience</h3>
                    <p className="text-sm text-gray-400">
                      Responsive <strong>chess game online</strong> that works perfectly on desktop, tablet, and mobile. Play <strong>instant chess</strong> anywhere, anytime with smooth touch controls.
                    </p>
                  </div>
                </div>
              </div>

              {auth.isAuthenticated && (
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-lg border border-blue-900/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium text-blue-300">Ranked Player Benefits</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    • Your wins and losses are tracked<br />
                    • Climb the ELO ladder to earn titles<br />
                    • View detailed game history and statistics
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Currently Playing Players */}
          {globalStats.currentlyPlaying.length > 0 && (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-500" />
                  Currently Playing ({globalStats.currentlyPlaying.length} players)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {globalStats.currentlyPlaying.map((player, index) => (
                    <div 
                      key={`${player.gameId}-${index}`}
                      className="flex items-center justify-between p-2 bg-gray-700/30 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-white text-sm font-medium">
                          {player.playerName}
                        </span>
                        {player.rank && (
                          <Badge className={`${getTitleColor(getPlayerTitle(player.rank))} border-current bg-current/10 text-xs`}>
                            {player.rank} ELO
                          </Badge>
                        )}
                      </div>
                      <Badge variant="outline" className="bg-purple-900/20 border-purple-900/50 text-purple-400 text-xs">
                        In Game
                      </Badge>
                    </div>
                  ))}
                </div>
                
                {globalStats.currentlyPlaying.length > 8 && (
                  <div className="text-center text-xs text-gray-500 mt-2">
                    Showing active players...
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Server Statistics */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Server Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-green-400">{globalStats.activeGames}</div>
                  <div className="text-xs text-gray-400">Active Games</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-blue-400">{globalStats.playersOnline}</div>
                  <div className="text-xs text-gray-400">Players Online</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-purple-400">{globalStats.queueSize}</div>
                  <div className="text-xs text-gray-400">In Queue</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-orange-400">{globalStats.currentlyPlaying.length}</div>
                  <div className="text-xs text-gray-400">Playing Now</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Connection Status */}
        <div className="mt-8 text-center">
          <Badge 
            variant={isConnected ? "default" : "destructive"}
            className={isConnected ? "bg-green-900/20 border-green-900/50 text-green-400" : ""}
          >
            {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
          </Badge>
        </div>

        {/* SEO Footer Content */}
        <footer className="mt-16 border-t border-gray-700 pt-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-white font-semibold mb-4">🚀 Play Kung Fu Chess Online</h3>
              <div className="text-sm text-gray-400 space-y-2">
                <p>Experience the future of <strong>online chess games</strong> with our revolutionary <strong>real-time chess</strong> platform.</p>
                <p>Join thousands of players in <strong>competitive chess battles</strong> where strategy meets speed!</p>
                <ul className="list-disc list-inside space-y-1 mt-3">
                  <li>Free <strong>multiplayer chess game</strong></li>
                  <li><strong>ELO chess ratings</strong> and rankings</li>
                  <li><strong>Instant chess matchmaking</strong></li>
                  <li>Mobile-friendly <strong>chess gameplay</strong></li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">♟️ Chess Game Features</h3>
              <div className="text-sm text-gray-400 space-y-2">
                <p><strong>Simultaneous chess</strong> mechanics with traditional chess rules</p>
                <ul className="list-disc list-inside space-y-1 mt-3">
                  <li><strong>Speed chess</strong> with piece cooldowns</li>
                  <li><strong>Chess strategy</strong> in real-time format</li>
                  <li><strong>Chess tactics</strong> for fast-paced games</li>
                  <li>Advanced <strong>chess variants</strong> and modes</li>
                  <li><strong>Live chess</strong> spectator options</li>
                  <li><strong>Chess with friends</strong> private rooms</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">🏆 Competitive Chess</h3>
              <div className="text-sm text-gray-400 space-y-2">
                <p>Master <strong>rapid chess online</strong> and climb the competitive ladder</p>
                <ul className="list-disc list-inside space-y-1 mt-3">
                  <li>Novice to Grandmaster rankings</li>
                  <li><strong>Chess improvement</strong> tracking</li>
                  <li>Detailed game statistics</li>
                  <li><strong>Chess tournament</strong> potential</li>
                  <li>Global leaderboards</li>
                  <li>Achievement system</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-6">
            <div className="text-center space-y-4">
              <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
                <span>Keywords: <strong>kung fu chess</strong>, <strong>real-time chess</strong>, <strong>simultaneous chess</strong></span>
                <span>•</span>
                <span><strong>online chess game</strong>, <strong>multiplayer chess</strong>, <strong>speed chess</strong></span>
                <span>•</span>
                <span><strong>chess strategy</strong>, <strong>competitive chess</strong>, <strong>ELO rating</strong></span>
              </div>
              <p className="text-sm text-gray-500">
                © 2024 Kung Fu Chess Online - The Ultimate <strong>Real-Time Multiplayer Chess Experience</strong>
              </p>
              <div className="text-xs text-gray-600">
                Play the most innovative <strong>chess game online</strong> • Experience <strong>lightning-fast chess</strong> gameplay • 
                Join the global <strong>chess community</strong> • Master <strong>instant chess</strong> strategies
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Authentication Modals */}
      <LoginModal
        isOpen={auth.isLoginModalOpen}
        onClose={auth.closeLoginModal}
        onLogin={auth.login}
        onRegister={auth.register}
      />

      {auth.player && (
        <PlayerProfile
          player={auth.player}
          isOpen={auth.isProfileModalOpen}
          onClose={auth.closeProfileModal}
          onLogout={auth.logout}
        />
      )}

      {/* Chat Modal */}
      <ChatModal
        isOpen={chatPrompt.isPromptOpen}
        onClose={chatPrompt.closePrompt}
      />
    </div>
  );
}
