"use client";

import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { LogOut, Eye, Github, LogIn, Heart, Flag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConnectionStatus } from "@/components/game/ConnectionStatus";
import { SpectatorInfo } from "@/components/game/SpectatorInfo";
import { WaitingRoom } from "@/components/game/WaitingRoom";
import { GameSettings } from "@/components/game/GameSettings";
import { GameStarted } from "@/components/game/GameStarted";
import { TipModal } from "@/components/ui/TipModal";
import { GameModeConfig } from "@/components/game/GameModeSelector";
import { useSocket } from "@/lib/hooks/useSocket";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTipPrompt } from "@/lib/hooks/useTipPrompt";
import { useAIPlayer } from "@/lib/hooks/useAIPlayer";
import { GameSettings as GameSettingsType, GameState } from "@/app/models/Game";
import { Square } from "chess.js";

function GamePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Get game ID from either search params or URL hash (for backward compatibility)
  const searchParamGameId = searchParams.get("id");
  const [hashGameId, setHashGameId] = useState<string | null>(null);
  const [pendingMoves, setPendingMoves] = useState<Map<string, string>>(new Map()); // moveKey -> moveId
  const [lastGameStatus, setLastGameStatus] = useState<string | null>(null);
  
  // AI Mode State
  const [aiMode, setAiMode] = useState<GameModeConfig>({ mode: 'pvp' });
  const [isAIGame, setIsAIGame] = useState(false);
  const [aiGameState, setAiGameState] = useState<(GameState & { board: (any[] | null)[] }) | null>(null);

  const {
    isConnected,
    gameState: serverGameState,
    playerId,
    isSpectator,
    possibleMoves,
    pieceCooldowns,
    movesLeft,
    isMatchmaking,
    joinGame,
    leaveGame,
    switchSides,
    startGame,
    setGameSettings,
    makeMove,
    requestPossibleMoves,
    findRandomPlayer,
    cancelMatchmaking,
    restartGame,
    socket,
  } = useSocket();

  // Use AI game state when in AI mode, otherwise use server game state
  const gameState = isAIGame && aiGameState ? aiGameState : serverGameState;

  const auth = useAuth({ socket });
  const tipPrompt = useTipPrompt();

  // Generate local possible moves for AI games
  const [localPossibleMoves, setLocalPossibleMoves] = useState<{ [square: string]: string[] }>({});

  // Generate simple possible moves for AI game (simplified version)
  const generateLocalPossibleMoves = (gameState: any) => {
    if (!gameState || !gameState.board) return {};
    
    const moves: { [square: string]: string[] } = {};
    const board = gameState.board;
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece) {
          const square = String.fromCharCode(97 + col) + (8 - row);
          const possibleSquares: string[] = [];
          
          // Generate moves based on piece type (simplified)
          switch (piece.type) {
            case 'p': // Pawn
              const direction = piece.color === 'w' ? -1 : 1;
              const newRow = row + direction;
              if (newRow >= 0 && newRow < 8) {
                const targetSquare = String.fromCharCode(97 + col) + (8 - newRow);
                possibleSquares.push(targetSquare);
              }
              break;
              
            case 'r': // Rook
              // Horizontal and vertical moves
              for (let i = 0; i < 8; i++) {
                if (i !== col) {
                  possibleSquares.push(String.fromCharCode(97 + i) + (8 - row));
                }
                if (i !== row) {
                  possibleSquares.push(String.fromCharCode(97 + col) + (8 - i));
                }
              }
              break;
              
            case 'n': // Knight
              const knightMoves = [[-2,-1], [-2,1], [-1,-2], [-1,2], [1,-2], [1,2], [2,-1], [2,1]];
              for (const [dr, dc] of knightMoves) {
                const newRow = row + dr;
                const newCol = col + dc;
                if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                  possibleSquares.push(String.fromCharCode(97 + newCol) + (8 - newRow));
                }
              }
              break;
              
            case 'b': // Bishop
              // Diagonal moves
              for (let i = 1; i < 8; i++) {
                for (const [dr, dc] of [[1,1], [1,-1], [-1,1], [-1,-1]]) {
                  const newRow = row + dr * i;
                  const newCol = col + dc * i;
                  if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                    possibleSquares.push(String.fromCharCode(97 + newCol) + (8 - newRow));
                  }
                }
              }
              break;
              
            case 'q': // Queen (combination of rook and bishop)
              // All directions
              for (let i = 1; i < 8; i++) {
                for (const [dr, dc] of [[0,1], [0,-1], [1,0], [-1,0], [1,1], [1,-1], [-1,1], [-1,-1]]) {
                  const newRow = row + dr * i;
                  const newCol = col + dc * i;
                  if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                    possibleSquares.push(String.fromCharCode(97 + newCol) + (8 - newRow));
                  }
                }
              }
              break;
              
            case 'k': // King
              for (const [dr, dc] of [[-1,-1], [-1,0], [-1,1], [0,-1], [0,1], [1,-1], [1,0], [1,1]]) {
                const newRow = row + dr;
                const newCol = col + dc;
                if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                  possibleSquares.push(String.fromCharCode(97 + newCol) + (8 - newRow));
                }
              }
              break;
          }
          
          if (possibleSquares.length > 0) {
            moves[square] = possibleSquares;
          }
        }
      }
    }
    
    return moves;
  };

  // Update local possible moves when AI game state changes
  useEffect(() => {
    if (isAIGame && aiGameState) {
      const localMoves = generateLocalPossibleMoves(aiGameState);
      setLocalPossibleMoves(localMoves);
      console.log('🤖 Generated local possible moves:', Object.keys(localMoves).length, 'pieces can move');
    } else {
      setLocalPossibleMoves({});
    }
  }, [isAIGame, aiGameState]);

  // AI Player Hook - use local moves for AI games
  const aiPlayer = useAIPlayer({
    isAIEnabled: isAIGame && aiMode.mode === 'ai',
    aiSide: aiMode.aiSide || 'black',
    aiDifficulty: aiMode.aiDifficulty || 'medium',
    gameState,
    possibleMoves: isAIGame ? localPossibleMoves : possibleMoves,
    pieceCooldowns,
    canMakeMove: !!gameState && gameState.status === 'playing' && !isSpectator,
    onAIMove: (from: Square, to: Square) => {
      console.log(`🤖 AI making move: ${from} to ${to}`);
      handleMove(from, to);
    }
  });

  // Handle game mode selection
  const handleModeSelect = (config: GameModeConfig) => {
    console.log('🎮 Game mode selected:', config);
    setAiMode(config);
    
    if (config.mode === 'ai') {
      setIsAIGame(true);
      console.log('🤖 AI mode enabled:', config);
    } else {
      setIsAIGame(false);
    }
  };

  // Custom ready handler for AI games
  const handleReadyForAI = () => {
    if (isAIGame) {
      console.log('🤖 Starting AI game...');
      // For AI games, we can start immediately since the AI is always "ready"
      startGame();
    } else {
      startGame();
    }
  };

  // Handle starting AI game
  const handleStartAIGame = () => {
    if (gameState && isAIGame) {
      console.log('🤖 Starting AI game directly...');
      
      // Create initial chess board
      const initialBoard = createInitialChessBoard();
      
      // For AI games, we'll create a mock game state that shows we're playing
      // without needing server validation of two players
      const humanSide = aiMode.aiSide === 'white' ? 'black' : 'white';
      const humanPlayer = { ...gameState.players[0], side: humanSide as 'white' | 'black' };
      
      const aiGameState = {
        ...gameState,
        status: 'playing' as const,
        players: [
          humanPlayer, // Human player with correct side
          {
            id: `ai-${Date.now()}`,
            socketId: `ai-socket-${Date.now()}`,
            name: `AI (${aiMode.aiDifficulty?.toUpperCase() || 'MEDIUM'})`,
            side: (aiMode.aiSide || 'black') as 'white' | 'black',
            isReady: true
          }
        ],
        bothPlayersReady: true,
        settings: gameState.settings || {
          maxMovesPerPeriod: 3,
          pieceCooldownSeconds: 5,
          enableRandomPieceGeneration: false,
          enableHitPointsSystem: false,
        },
        board: initialBoard
      };
      
      // Override the game state temporarily for AI mode
      setAiGameState(aiGameState);
      
      // Generate initial possible moves
      setTimeout(() => {
        const localMoves = generateLocalPossibleMoves(aiGameState);
        setLocalPossibleMoves(localMoves);
        console.log('🤖 AI game started with', Object.keys(localMoves).length, 'possible pieces to move');
      }, 100);
    }
  };

  // Create initial chess board layout
  const createInitialChessBoard = () => {
    // Create 8x8 board with initial chess position
    const board = Array(8).fill(null).map(() => Array(8).fill(null));
    
    // Place pawns
    for (let i = 0; i < 8; i++) {
      board[1][i] = { type: 'p', color: 'b' };
      board[6][i] = { type: 'p', color: 'w' };
    }
    
    // Place other pieces
    const pieces = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
    for (let i = 0; i < 8; i++) {
      board[0][i] = { type: pieces[i], color: 'b' };
      board[7][i] = { type: pieces[i], color: 'w' };
    }
    
    return board;
  };

  // Handle leaving AI game
  const handleLeaveAIGame = () => {
    console.log('👋 Leaving AI game...');
    
    // Reset AI mode state
    setIsAIGame(false);
    setAiGameState(null);
    setAiMode({ mode: 'pvp' });
    
    // Leave the actual game on the server
    leaveGame();
  };

  // Sync AI game state with server changes when needed
  useEffect(() => {
    if (!isAIGame || !serverGameState) {
      setAiGameState(null);
      return;
    }
    
    // If server game state changes significantly (like player leaving), 
    // reset AI game state to let server state take over
    if (serverGameState.players.length === 0) {
      setAiGameState(null);
      setIsAIGame(false);
    }
  }, [isAIGame, serverGameState]);

  useEffect(() => {
    // Extract game ID from URL hash for backward compatibility
    const extractGameId = () => {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#')) {
        return hash.substring(1);
      }
      return null;
    };

    const id = extractGameId();
    setHashGameId(id);

    // Listen for hash changes
    const handleHashChange = () => {
      const newId = extractGameId();
      setHashGameId(newId);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Use search params first, then fall back to hash
  const gameId = searchParamGameId || hashGameId;
  const [shareableLink, setShareableLink] = useState("");

  // Track game completion for tip prompting
  useEffect(() => {
    if (gameState?.status === 'finished' && lastGameStatus !== 'finished') {
      // Game just finished - could trigger chat prompt logic here if needed
    }
    setLastGameStatus(gameState?.status || null);
  }, [gameState?.status, lastGameStatus]);

  useEffect(() => {
    if (!gameId) {
      return;
    }

    // Create shareable link using search params format for consistency
    const link = `${window.location.origin}/game?id=${gameId}`;
    setShareableLink(link);

    // Join the game when connected
    if (isConnected) {
      joinGame(gameId);
    }
  }, [gameId, isConnected, joinGame]);

  // Auto-match functionality - trigger find random player when autoMatch=true
  useEffect(() => {
    const autoMatch = searchParams.get("autoMatch");
    
    if (autoMatch === "true" && 
        gameState?.status === "waiting" && 
        gameState?.players.length === 1 &&
        isConnected && 
        !isSpectator && 
        !isMatchmaking) {
      
      // Find the current player to get their name
      const currentPlayer = gameState.players.find(p => p.id === playerId);
      const playerName = currentPlayer?.name;
      
      // Automatically trigger find random player
      console.log('Auto-triggering find random player for:', playerName);
      findRandomPlayer(playerName);
      
      // Clean up the URL parameter to avoid re-triggering
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("autoMatch");
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [searchParams, gameState, isConnected, isSpectator, isMatchmaking, playerId, findRandomPlayer]);

  const handleSettingsSubmit = (settings: GameSettingsType) => {
    setGameSettings(settings);
  };

  const handleMove = (from: string, to: string, promotion?: string) => {
    const moveKey = `${from}-${to}-${promotion || ''}`;
    
    // Store the pending move to track success/failure
    setPendingMoves(prev => {
      const newMap = new Map(prev);
      // We'll get the moveId from the ChessBoard component
      newMap.set(moveKey, 'pending');
      return newMap;
    });
    
    // For AI games, handle moves locally
    if (isAIGame && aiGameState) {
      handleAIGameMove(from, to, promotion);
    } else {
      // Regular server-based move
      makeMove(from as Square, to as Square, promotion);
    }
  };

  // Handle moves in AI game mode (local simulation)
  const handleAIGameMove = (from: string, to: string, promotion?: string) => {
    console.log(`🎮 Local AI game move: ${from} to ${to}`);
    
    // For now, we'll simulate the move by updating the local state
    // In a real implementation, you might want to have a local chess engine
    // But for this demo, we'll just assume moves are valid and update the board
    
    // Create a simple move in the move history
    const moveRecord = {
      from: from as Square,
      to: to as Square,
      piece: { type: 'p' as const, color: 'w' as const }, // Simplified
      timestamp: new Date()
    };
    
    if (aiGameState) {
      const updatedGameState = {
        ...aiGameState,
        moveHistory: [...aiGameState.moveHistory, moveRecord]
      };
      
      setAiGameState(updatedGameState);
      
      // Simulate successful move
      setTimeout(() => {
        handleMoveSuccess('ai-move-' + Date.now());
      }, 100);
    }
  };

  const handleMoveSuccess = (moveId: string) => {
    // Remove from pending moves on success
    setPendingMoves(prev => {
      const newMap = new Map(prev);
      for (const [key, id] of newMap.entries()) {
        if (id === moveId) {
          newMap.delete(key);
          break;
        }
      }
      return newMap;
    });
  };

  const handleMoveError = (moveId: string, error: string) => {
    // Remove from pending moves and show error
    setPendingMoves(prev => {
      const newMap = new Map(prev);
      for (const [key, id] of newMap.entries()) {
        if (id === moveId) {
          newMap.delete(key);
          break;
        }
      }
      return newMap;
    });
    
    // Show error message to user
    console.error('Move failed:', error);
    
    // Request fresh board state from server to ensure consistency
    setTimeout(() => {
      requestPossibleMoves();
    }, 100);
  };

  const handleSurrender = () => {
    if (socket && gameState?.status === 'playing') {
      socket.emit('surrender');
    }
  };

  const openGitHubRepo = () => {
    // Open GitHub repository (replace with actual repo URL when available)
    window.open('https://github.com/watislaf/kungfu-chess.com', '_blank');
  };

  const handleLoginRedirect = () => {
    // Redirect to main page for login
    router.push('/');
  };

  const handleBackToHome = () => {
    // Navigate back to the main page
    router.push('/');
  };

  if (!gameId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-2">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            No game ID found. Please join a game from the home page.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background sm:p-4">
      {/* Fixed buttons - positioned absolutely in bottom right */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        <div className="flex gap-2">
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
        {/* Login button for non-authenticated users */}
        {!auth.isAuthenticated && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoginRedirect}
            className="bg-blue-900/20 border-blue-900/50 text-blue-400 hover:bg-blue-900/40 backdrop-blur-sm w-full"
          >
            <LogIn className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
            <span className="hidden sm:inline">Login / Register</span>
            <span className="sm:hidden">Login</span>
          </Button>
        )}
      </div>

      {/* AI Status Indicator */}
      {isAIGame && aiPlayer.isAIEnabled && (
        <div className="fixed top-4 left-4 z-40">
          <Badge 
            variant="secondary" 
            className={`${aiPlayer.isAIThinking ? 'animate-pulse bg-yellow-500/20 text-yellow-600' : 'bg-blue-500/20 text-blue-600'} border-0`}
          >
            🤖 AI {aiPlayer.isAIThinking ? 'Thinking...' : `(${aiPlayer.aiDifficulty})`}
          </Badge>
        </div>
      )}

      {/* Mobile layout - no margins/padding, full screen usage */}
      <div className="sm:hidden">
        {/* Game states for mobile */}
        {gameState?.status === "waiting" && (
          <div className="p-2">
            <WaitingRoom
              gameState={gameState}
              playerId={playerId}
              shareableLink={shareableLink}
              isSpectator={isSpectator}
              isMatchmaking={isMatchmaking}
              onFindRandomPlayer={findRandomPlayer}
              onCancelMatchmaking={cancelMatchmaking}
              onModeSelect={handleModeSelect}
              isAIGame={isAIGame}
              onStartAIGame={handleStartAIGame}
              onLeaveGame={handleLeaveAIGame}
            />
          </div>
        )}

        {gameState?.status === "settings" && (
          <div className="p-2">
            <GameSettings
              gameState={gameState}
              playerId={playerId}
              shareableLink={shareableLink}
              onSwitchSides={switchSides}
              onReady={handleReadyForAI}
              onSettingsSubmit={handleSettingsSubmit}
              isSpectator={isSpectator}
            />
          </div>
        )}

        {(gameState?.status === "playing" || gameState?.status === "finished") && (
          <>
            <GameStarted
              gameState={gameState}
              playerId={playerId}
              gameId={gameId}
              isConnected={isConnected}
              isSpectator={isSpectator}
              possibleMoves={isAIGame ? localPossibleMoves : possibleMoves}
              pieceCooldowns={pieceCooldowns}
              movesLeft={movesLeft}
              onMove={handleMove}
              onRequestPossibleMoves={requestPossibleMoves}
              onMoveSuccess={handleMoveSuccess}
              onMoveError={handleMoveError}
              onSurrender={handleSurrender}
              onRestartGame={restartGame}
              onBackToHome={handleBackToHome}
            />
          </>
        )}

        {/* Loading states for mobile */}
        {!gameState && isConnected && (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-muted-foreground text-sm">Joining...</p>
          </div>
        )}

        {!isConnected && (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-destructive mx-auto mb-2"></div>
            <p className="text-destructive text-sm">Connecting...</p>
          </div>
        )}
      </div>

      {/* Desktop layout - keep existing with proper spacing */}
      <div className="hidden sm:block max-w-4xl mx-auto space-y-1.5 sm:space-y-4">
        {/* Header - more compact */}
        <div className="flex justify-between items-center bg-card rounded-lg sm:rounded-2xl p-1 sm:p-2 border">
          <div className="flex items-center gap-1 sm:gap-2">
            <button 
              onClick={() => router.push('/')}
              className="hover:scale-110 transition-transform duration-200 cursor-pointer"
              title="Return to Main Page"
            >
              <img 
                src="/favicon.svg" 
                alt="Kung Fu Chess Logo" 
                className="w-4 h-4 sm:w-6 sm:h-6" 
              />
            </button>
            <div>
              <div className="flex items-center gap-1 sm:gap-2">
                <h1 className="text-xs sm:text-sm font-bold">
                  <span className="sm:hidden">Kung Fu Chess</span>
                  <span className="hidden sm:inline">Kung Fu Chess</span>
                </h1>
                {isSpectator && (
                  <Badge
                    variant="secondary"
                    className="text-xs rounded-sm sm:rounded-md animate-pulse px-0.5 sm:px-1 py-0"
                  >
                    <Eye className="h-1.5 w-1.5 sm:h-2.5 sm:w-2.5 mr-0.5" />
                    <span className="sm:hidden">👁</span>
                    <span className="hidden sm:inline">Spectator</span>
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <ConnectionStatus isConnected={isConnected} gameId={gameId} />
                {gameState && (
                  <SpectatorInfo
                    spectatorCount={gameState.spectators?.length || 0}
                  />
                )}
              </div>
            </div>
          </div>
          
          {/* Exit/Surrender Button */}
          {!isSpectator && (gameState?.status === 'playing' || gameState?.status === 'finished') && (
            <div className="flex items-center gap-1">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleSurrender}
                className="h-6 w-6 sm:h-8 sm:w-8 p-0 rounded-full bg-red-600 hover:bg-red-700 border-2 border-red-800 shadow-lg"
                title="Surrender Game"
              >
                <Flag className="h-2.5 w-2.5 sm:h-4 sm:w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Loading states - more compact */}
        {!gameState && isConnected && (
          <Card className="rounded-lg sm:rounded-2xl animate-pulse">
            <CardContent className="p-1 sm:p-3 text-center">
              <div className="animate-spin rounded-full h-2.5 w-2.5 sm:h-4 sm:w-4 border-b-2 border-primary mx-auto mb-1 sm:mb-2"></div>
              <p className="text-muted-foreground text-xs sm:text-sm">
                Joining...
              </p>
            </CardContent>
          </Card>
        )}

        {!isConnected && (
          <Card className="border-destructive/50 rounded-lg sm:rounded-2xl animate-pulse">
            <CardContent className="p-1 sm:p-3 text-center">
              <div className="animate-spin rounded-full h-2.5 w-2.5 sm:h-4 sm:w-4 border-b-2 border-destructive mx-auto mb-1 sm:mb-2"></div>
              <p className="text-destructive text-xs sm:text-sm">
                Connecting...
              </p>
            </CardContent>
          </Card>
        )}

        {/* Game states */}
        {gameState?.status === "waiting" && (
          <WaitingRoom
            gameState={gameState}
            playerId={playerId}
            shareableLink={shareableLink}
            isSpectator={isSpectator}
            isMatchmaking={isMatchmaking}
            onFindRandomPlayer={findRandomPlayer}
            onCancelMatchmaking={cancelMatchmaking}
            onModeSelect={handleModeSelect}
            isAIGame={isAIGame}
            onStartAIGame={handleStartAIGame}
            onLeaveGame={handleLeaveAIGame}
          />
        )}

        {gameState?.status === "settings" && (
          <GameSettings
            gameState={gameState}
            playerId={playerId}
            shareableLink={shareableLink}
            onSwitchSides={switchSides}
            onReady={handleReadyForAI}
            onSettingsSubmit={handleSettingsSubmit}
            isSpectator={isSpectator}
          />
        )}

        {gameState?.status === "playing" && (
          <GameStarted
            gameState={gameState}
            playerId={playerId}
            gameId={gameId}
            isConnected={isConnected}
            isSpectator={isSpectator}
            possibleMoves={isAIGame ? localPossibleMoves : possibleMoves}
            pieceCooldowns={pieceCooldowns}
            movesLeft={movesLeft}
            onMove={handleMove}
            onRequestPossibleMoves={requestPossibleMoves}
            onMoveSuccess={handleMoveSuccess}
            onMoveError={handleMoveError}
            onSurrender={handleSurrender}
            onRestartGame={restartGame}
            onBackToHome={handleBackToHome}
          />
        )}

        {gameState?.status === "finished" && (
          <GameStarted
            gameState={gameState}
            playerId={playerId}
            gameId={gameId}
            isConnected={isConnected}
            isSpectator={isSpectator}
            possibleMoves={isAIGame ? localPossibleMoves : possibleMoves}
            pieceCooldowns={pieceCooldowns}
            movesLeft={movesLeft}
            onMove={handleMove}
            onRequestPossibleMoves={requestPossibleMoves}
            onMoveSuccess={handleMoveSuccess}
            onMoveError={handleMoveError}
            onSurrender={handleSurrender}
            onRestartGame={restartGame}
            onBackToHome={handleBackToHome}
          />
        )}
      </div>

      {/* Tip Modal */}
      <TipModal
        isOpen={tipPrompt.isPromptOpen}
        onClose={tipPrompt.closePrompt}
        onTipped={tipPrompt.onUserTipped}
      />
    </div>
  );
}

export default function GamePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <GamePageContent />
    </Suspense>
  );
}
