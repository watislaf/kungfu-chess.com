import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { GameManager } from '../models/GameManager';
import { Player } from '../models/Game';
import { GameSettings } from '../models/Game';
import { Square } from 'chess.js';
import { v4 as uuidv4 } from 'uuid';
import { compareGameSettings } from '../utils/deepCompare';
import { Socket } from 'socket.io';
import { AuthService } from '../services/AuthService';
import { LoginCredentials, RegisterData } from '../models/Player';

export class SocketController {
  private io: SocketIOServer;
  private gameManager: GameManager;
  private cleanupInterval: NodeJS.Timeout;
  private authService: AuthService;

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    this.gameManager = new GameManager();
    this.authService = AuthService.getInstance();
    this.setupEventHandlers();
    
    // Set up periodic cleanup for matchmaking queue
    this.cleanupInterval = setInterval(async () => {
      try {
        await this.gameManager.cleanupMatchmakingQueue();
      } catch (error) {
        console.error('Error during matchmaking cleanup:', error);
      }
    }, 60000); // Clean up every minute
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log('🔌 New connection:', socket.id);
      
      try {
        this.sendGlobalStats(socket);
      } catch (error) {
        console.error('Error sending global stats on connection:', error);
      }

      // Authentication events with error handling
      socket.on('auth:login', async (credentials: LoginCredentials) => {
        try {
          console.log('🔐 Login attempt for:', credentials.username);
          const result = await this.authService.login(credentials);
          
          if (result.success && result.player) {
            // Associate socket with authenticated player
            socket.data.playerId = result.player.id;
            socket.data.player = result.player;
            console.log('✅ Login successful:', result.player.displayName);
          }
          
          socket.emit('auth:login-response', result);
        } catch (error) {
          console.error('Error during login:', error);
          socket.emit('auth:login-response', { 
            success: false, 
            message: 'Login failed due to server error' 
          });
        }
      });

      socket.on('auth:register', async (data: RegisterData) => {
        try {
          console.log('📝 Registration attempt for:', data.username);
          const result = await this.authService.register(data);
          
          if (result.success && result.player) {
            // Associate socket with new player
            socket.data.playerId = result.player.id;
            socket.data.player = result.player;
            console.log('✅ Registration successful:', result.player.displayName);
          }
          
          socket.emit('auth:register-response', result);
        } catch (error) {
          console.error('Error during registration:', error);
          socket.emit('auth:register-response', { 
            success: false, 
            message: 'Registration failed due to server error' 
          });
        }
      });

      socket.on('auth:logout', () => {
        try {
          console.log('👋 Logout:', socket.data.player?.displayName || socket.id);
          delete socket.data.playerId;
          delete socket.data.player;
          socket.emit('auth:logout-response', { success: true });
        } catch (error) {
          console.error('Error during logout:', error);
          socket.emit('auth:logout-response', { success: false });
        }
      });

      socket.on('auth:get-profile', async () => {
        try {
          if (!socket.data.playerId) {
            socket.emit('auth:profile-response', { success: false, message: 'Not authenticated' });
            return;
          }
          
          const player = await this.authService.getPlayerById(socket.data.playerId);
          socket.emit('auth:profile-response', { success: true, player });
        } catch (error) {
          console.error('Error getting profile:', error);
          socket.emit('auth:profile-response', { 
            success: false, 
            message: 'Failed to get profile' 
          });
        }
      });

      socket.on('auth:validate-session', async (data: { playerId: string }) => {
        try {
          console.log('🔍 Session validation for player:', data.playerId);
          const result = await this.authService.validateSession(data.playerId);
          
          if (result.valid && result.player) {
            // Associate socket with validated player
            socket.data.playerId = result.player.id;
            socket.data.player = result.player;
            console.log('✅ Session validated for:', result.player.displayName);
          } else {
            console.log('❌ Session validation failed for:', data.playerId);
            // Clear any existing socket data
            delete socket.data.playerId;
            delete socket.data.player;
          }
          
          socket.emit('auth:session-validation-response', result);
        } catch (error) {
          console.error('Error during session validation:', error);
          socket.emit('auth:session-validation-response', { 
            valid: false, 
            message: 'Session validation failed' 
          });
        }
      });

      // Game events with authentication and error handling
      socket.on('join-game', (data: { gameId: string; playerName?: string }) => {
        try {
          this.handleJoinGame(socket, data.gameId, data.playerName);
        } catch (error) {
          console.error('Error in join-game handler:', error);
          socket.emit('game-joined', { 
            success: false, 
            message: 'Failed to join game due to server error' 
          });
        }
      });

      socket.on('leave-game', () => {
        try {
          this.handleLeaveGame(socket);
        } catch (error) {
          console.error('Error in leave-game handler:', error);
        }
      });

      socket.on('switch-sides', () => {
        try {
          this.handleSwitchSides(socket);
        } catch (error) {
          console.error('Error in switch-sides handler:', error);
        }
      });

      socket.on('player-ready', () => {
        try {
          this.handlePlayerReady(socket);
        } catch (error) {
          console.error('Error in player-ready handler:', error);
        }
      });

      socket.on('set-game-settings', (settings: GameSettings) => {
        try {
          this.handleSetGameSettings(socket, settings);
        } catch (error) {
          console.error('Error in set-game-settings handler:', error);
        }
      });

      socket.on('make-move', (data: { from: string; to: string; promotion?: string }) => {
        try {
          this.handleMakeMove(socket, data.from, data.to, data.promotion);
        } catch (error) {
          console.error('Error in make-move handler:', error);
          socket.emit('move-error', { message: 'Failed to make move due to server error' });
        }
      });

      socket.on('request-possible-moves', () => {
        try {
          this.handleRequestPossibleMoves(socket);
        } catch (error) {
          console.error('Error in request-possible-moves handler:', error);
        }
      });

      socket.on('surrender', () => {
        try {
          this.handleSurrender(socket);
        } catch (error) {
          console.error('Error in surrender handler:', error);
        }
      });

      socket.on('restart-game', () => {
        try {
          this.handleRestartGame(socket);
        } catch (error) {
          console.error('Error in restart-game handler:', error);
        }
      });

      socket.on('find-random-player', (data: { playerName?: string }) => {
        try {
          this.handleFindRandomPlayer(socket, data.playerName);
        } catch (error) {
          console.error('Error in find-random-player handler:', error);
          socket.emit('matchmaking-error', { 
            message: 'Failed to find player due to server error' 
          });
        }
      });

      socket.on('cancel-matchmaking', () => {
        try {
          this.handleCancelMatchmaking(socket);
        } catch (error) {
          console.error('Error in cancel-matchmaking handler:', error);
        }
      });

      socket.on('disconnect', () => {
        try {
          this.handleDisconnect(socket);
        } catch (error) {
          console.error('Error in disconnect handler:', error);
        }
      });
    });
  }

  private handleJoinGame(socket: Socket, gameId: string, playerName?: string): void {
    try {
      // Validate input parameters
      if (!gameId || typeof gameId !== 'string') {
        console.log('❌ Invalid gameId provided:', gameId);
        socket.emit('game-joined', { 
          success: false, 
          message: 'Invalid game ID provided' 
        });
        return;
      }

      // Use authenticated player name if available
      const effectivePlayerName = socket.data.player?.displayName || playerName || 'Unknown Player';
      const playerId = socket.data.playerId || socket.id;
      
      console.log(`🎮 Player ${effectivePlayerName} (${playerId}) attempting to join game ${gameId}`);
      
      const result = this.gameManager.joinGame(gameId, {
        id: playerId,
        socketId: socket.id,
        name: effectivePlayerName,
      });

      console.log(`🎮 Join game result for ${effectivePlayerName}:`, {
        success: result.success,
        isSpectator: result.isSpectator,
        message: result.message
      });

      if (result.success) {
        socket.join(gameId);
        socket.data.gameId = gameId;
        
        const game = this.gameManager.getGame(gameId);
        if (game) {
          const gameState = game.getState();
          socket.emit('game-joined', { 
            success: true, 
            gameState,
            playerId: playerId,
            isSpectator: result.isSpectator 
          });
          
          // Notify all players in the game
          socket.to(gameId).emit('game-updated', gameState);
          
          // Update global stats safely
          try {
            this.sendGlobalStats();
          } catch (statsError) {
            console.error('Error updating global stats after join:', statsError);
            // Don't fail the join operation due to stats error
          }
        } else {
          console.error(`❌ Game ${gameId} not found after successful join`);
          socket.emit('game-joined', { 
            success: false, 
            message: 'Game not found after joining' 
          });
        }
      } else {
        console.log(`❌ Failed to join game ${gameId}: ${result.message || 'Unknown error'}`);
        socket.emit('game-joined', { 
          success: false, 
          message: result.message || 'Failed to join game' 
        });
      }
    } catch (error) {
      console.error('Critical error in handleJoinGame:', error);
      // Always send a response to prevent client hanging
      socket.emit('game-joined', { 
        success: false, 
        message: 'A server error occurred while joining the game' 
      });
    }
  }

  private handleLeaveGame(socket: Socket): void {
    const gameId = socket.data.gameId;
    if (!gameId) return;

    try {
      const playerId = socket.data.playerId || socket.id;
      this.gameManager.leaveGame(playerId);
      
      socket.leave(gameId);
      delete socket.data.gameId;
      
      const game = this.gameManager.getGame(gameId);
      if (game) {
        const gameState = game.getState();
        socket.to(gameId).emit('game-updated', gameState);
      }
      
      this.sendGlobalStats();
    } catch (error) {
      console.error('Error leaving game:', error);
    }
  }

  private handleSwitchSides(socket: Socket): void {
    const gameId = socket.data.gameId;
    if (!gameId) return;

    try {
      const game = this.gameManager.getGame(gameId);
      if (game) {
        const success = game.switchSides();
        if (success) {
          const gameState = game.getState();
          socket.to(gameId).emit('game-updated', gameState);
          socket.emit('game-updated', gameState);
        }
      }
    } catch (error) {
      console.error('Error switching sides:', error);
    }
  }

  private handlePlayerReady(socket: Socket): void {
    const gameId = socket.data.gameId;
    if (!gameId) return;

    try {
      const playerId = socket.data.playerId || socket.id;
      const game = this.gameManager.getGame(gameId);
      
      if (game) {
        const success = game.setPlayerReady(playerId);
        if (success) {
          const gameState = game.getState();
          socket.to(gameId).emit('game-updated', gameState);
          socket.emit('game-updated', gameState);
        }
      }
    } catch (error) {
      console.error('Error setting player ready:', error);
    }
  }

  private handleSetGameSettings(socket: Socket, settings: GameSettings): void {
    const gameId = socket.data.gameId;
    if (!gameId) return;

    try {
      console.log('🎮 SocketController - Received settings:', {
        gameId,
        playerId: socket.data.playerId || socket.id,
        settings,
        socketId: socket.id
      });

      const game = this.gameManager.getGame(gameId);
      if (game) {
        const success = game.setGameSettings(settings);
        console.log('🎮 SocketController - Settings result:', success);
        
        if (success) {
          const gameState = game.getState();
          console.log('🎮 SocketController - Broadcasting updated game state with settings:', {
            gameId,
            settings: gameState.settings
          });
          
          // Broadcast to ALL players in the room (including sender)
          socket.to(gameId).emit('game-updated', gameState);
          socket.emit('game-updated', gameState);
        } else {
          console.log('❌ SocketController - Settings update failed');
        }
      }
    } catch (error) {
      console.error('Error setting game settings:', error);
    }
  }

  private handleMakeMove(socket: Socket, from: string, to: string, promotion?: string): void {
    const gameId = socket.data.gameId;
    if (!gameId) return;

    try {
      const playerId = socket.data.playerId || socket.id;
      const game = this.gameManager.getGame(gameId);
      
      if (game) {
        const result = game.makeMove(playerId, from as any, to as any, promotion);
        
        if (result.success) {
          const gameState = game.getState();
          socket.to(gameId).emit('game-updated', gameState);
          socket.emit('game-updated', gameState);
          
          // Handle rank updates when game ends
          if (gameState.status === 'finished' && gameState.winner && gameState.gameEndReason) {
            this.handleGameEnd(gameId, gameState);
          }
        } else {
          socket.emit('move-error', { message: result.message });
        }
      }
    } catch (error) {
      console.error('Error making move:', error);
      socket.emit('move-error', { message: 'Failed to make move' });
    }
  }

  private async handleGameEnd(gameId: string, gameState: any): Promise<void> {
    try {
      // Only update ranks if both players are authenticated
      const players = gameState.players;
      if (players.length !== 2) return;
      
      const [player1, player2] = players;
      
      // Check if both players are authenticated (have player profiles)
      const player1Profile = player1.id.startsWith('test-user-') || player1.id.length > 20; // Rough check for real player IDs
      const player2Profile = player2.id.startsWith('test-user-') || player2.id.length > 20;
      
      if (!player1Profile || !player2Profile) {
        console.log('🏆 Game ended but not all players are authenticated - skipping rank update');
        return;
      }
      
      const winnerId = gameState.winner;
      const gameEndReason = gameState.gameEndReason;
      
      // Determine results for each player
      let player1Result: 'win' | 'loss' | 'draw';
      let player2Result: 'win' | 'loss' | 'draw';
      
      if (gameEndReason === 'draw' || gameEndReason === 'stalemate') {
        player1Result = 'draw';
        player2Result = 'draw';
      } else if (winnerId === player1.id) {
        player1Result = 'win';
        player2Result = 'loss';
      } else if (winnerId === player2.id) {
        player1Result = 'loss';
        player2Result = 'win';
      } else {
        console.error('Unknown game result:', { winnerId, gameEndReason });
        return;
      }
      
      // Calculate game duration
      const gameDuration = gameState.createdAt ? 
        Math.floor((Date.now() - new Date(gameState.createdAt).getTime()) / 1000) : 
        undefined;
      
      // Update ranks for both players
      await Promise.all([
        this.authService.updatePlayerAfterGame(
          player1.id,
          player2.id,
          player1Result,
          gameId,
          gameEndReason,
          gameDuration
        ),
        this.authService.updatePlayerAfterGame(
          player2.id,
          player1.id,
          player2Result,
          gameId,
          gameEndReason,
          gameDuration
        )
      ]);
      
      console.log(`🏆 Ranks updated for game ${gameId}: ${player1.name} (${player1Result}) vs ${player2.name} (${player2Result})`);
      
    } catch (error) {
      console.error('Error updating ranks after game:', error);
    }
  }

  private handleRequestPossibleMoves(socket: Socket): void {
    const gameId = socket.data.gameId;
    if (!gameId) return;

    try {
      const playerId = socket.data.playerId || socket.id;
      const game = this.gameManager.getGame(gameId);
      
      if (game) {
        const possibleMoves = game.getPossibleMoves(playerId);
        const gameState = game.getState();
        
        // Calculate moves left for the player
        const now = new Date();
        const tenSecondsAgo = new Date(now.getTime() - 10000);
        const recentMoves = gameState.playerMoveHistory.filter(
          pmh => pmh.playerId === playerId && pmh.timestamp > tenSecondsAgo
        );
        const maxMoves = gameState.settings?.maxMovesPerPeriod || 3;
        const movesLeft = Math.max(0, maxMoves - recentMoves.length);
        
        // Send the complete response format that the client expects
        socket.emit('possible-moves', {
          possibleMoves,
          pieceCooldowns: gameState.pieceCooldowns,
          movesLeft
        });
      }
    } catch (error) {
      console.error('Error getting possible moves:', error);
    }
  }

  private handleSurrender(socket: Socket): void {
    const gameId = socket.data.gameId;
    if (!gameId) return;

    try {
      const playerId = socket.data.playerId || socket.id;
      const game = this.gameManager.getGame(gameId);
      
      if (game) {
        const result = game.surrender(playerId);
        
        if (result.success) {
          const gameState = game.getState();
          socket.to(gameId).emit('game-updated', gameState);
          socket.emit('game-updated', gameState);
          
          // Handle rank updates when game ends
          if (gameState.status === 'finished' && gameState.winner && gameState.gameEndReason) {
            this.handleGameEnd(gameId, gameState);
          }
        }
      }
    } catch (error) {
      console.error('Error surrendering:', error);
    }
  }

  private handleRestartGame(socket: Socket): void {
    const gameId = socket.data.gameId;
    if (!gameId) return;

    try {
      const game = this.gameManager.getGame(gameId);
      if (game) {
        game.resetGame();
        const gameState = game.getState();
        socket.to(gameId).emit('game-updated', gameState);
        socket.emit('game-updated', gameState);
      }
    } catch (error) {
      console.error('Error restarting game:', error);
    }
  }

  private async handleFindRandomPlayer(socket: Socket, playerName?: string): Promise<void> {
    try {
      // Use authenticated player name and rank if available
      const effectivePlayerName = socket.data.player?.displayName || playerName;
      const playerRank = socket.data.player?.rank; // Get player rank for matchmaking
      const playerId = socket.data.playerId || socket.id;
      
      console.log(`🔍 [handleFindRandomPlayer] ${effectivePlayerName} (rank: ${playerRank || 'unranked'}) looking for match`);
      
      // First, check if the player is already in a valid waiting game
      const existingGame = this.gameManager.getGameByPlayerId(playerId);
      if (existingGame) {
        const gameState = existingGame.getState();
        
        // If player is already in a waiting game, try to find someone to join it
        if (gameState.status === 'waiting' && gameState.players.length === 1) {
          console.log(`🔄 Player ${effectivePlayerName} already has waiting game ${gameState.id}, checking for available players to join`);
          
          // Get current queue to see if there are players looking for games
          const queueBefore = await this.gameManager.getMatchmakingQueueInfo();
          console.log(`🔍 Queue status: ${queueBefore.total} players waiting`);
          
          if (queueBefore.total > 0) {
            // Try to match with someone from the queue for the existing game
            const matchResult = await this.gameManager.findMatch(playerId, playerRank);
            
            if (matchResult.matched && matchResult.opponent) {
              // Found someone! Join them to the existing game instead of creating new one
              const player2Result = this.gameManager.joinGame(gameState.id, {
                id: matchResult.opponent.playerId,
                socketId: matchResult.opponent.socketId,
                name: matchResult.opponent.playerName,
              }, { isMatchmaking: true });
              
              console.log(`🎮 Join result for opponent to existing game: ${player2Result.success}`);
              
              if (player2Result.success) {
                // Both players are now in the existing game
                const updatedGameState = existingGame.getState();
                
                // Join both players to the room
                socket.join(gameState.id);
                socket.data.gameId = gameState.id;
                
                const opponentSocket = this.io?.sockets.sockets.get(matchResult.opponent.socketId);
                if (opponentSocket) {
                  opponentSocket.join(gameState.id);
                  opponentSocket.data.gameId = gameState.id;
                  
                  // Notify both players of successful match
                  socket.emit('matched-with-player', { 
                    success: true,
                    gameState: updatedGameState,
                    gameId: gameState.id,
                    playerId: playerId,
                    opponentName: matchResult.opponent.playerName 
                  });
                  
                  opponentSocket.emit('matched-with-player', { 
                    success: true,
                    gameState: updatedGameState,
                    gameId: gameState.id,
                    playerId: matchResult.opponent.playerId,
                    opponentName: effectivePlayerName 
                  });
                  
                  console.log(`✅ Successfully matched ${effectivePlayerName} with ${matchResult.opponent.playerName} in existing game ${gameState.id}`);
                  
                  // Broadcast updated game state
                  socket.to(gameState.id).emit('game-updated', updatedGameState);
                  await this.sendGlobalStats();
                  return;
                }
              }
            }
          }
          
          // No match found, add to queue and wait
          await this.gameManager.addToMatchmakingQueue(playerId, socket.id, effectivePlayerName, playerRank);
          const queueInfo = await this.gameManager.getMatchmakingQueueInfo();
          socket.emit('matchmaking-started', { 
            message: 'Looking for opponent...', 
            queuePosition: queueInfo.total 
          });
          console.log(`🔄 Player ${effectivePlayerName} already has waiting game, added to queue`);
          return;
        }
        
        // If player is in a different state game, proceed with normal matchmaking
        console.log(`🔄 Player ${effectivePlayerName} is in game with status ${gameState.status}, proceeding with normal matchmaking`);
      }

      // Normal matchmaking flow - try to find a match
      const queueBefore = await this.gameManager.getMatchmakingQueueInfo();
      console.log(`🔍 Queue status before match attempt: ${queueBefore.total} players (${queueBefore.ranked} ranked, ${queueBefore.unranked} unranked)`);

      const matchResult = await this.gameManager.findMatch(playerId, playerRank);
      
      console.log(`🎯 Match result for ${effectivePlayerName}:`, {
        matched: matchResult.matched,
        gameId: matchResult.gameId,
        opponentId: matchResult.opponent?.playerId,
        opponentName: matchResult.opponent?.playerName,
        opponentRank: matchResult.opponent?.playerRank
      });
      
      if (matchResult.matched && matchResult.gameId && matchResult.opponent) {
        // Match found! Create a new game and join both players
        const newGame = this.gameManager.createGame(matchResult.gameId);
        console.log(`🎮 Created new game ${matchResult.gameId} for matched players`);
        
        // Join both players to the new game
        const player1Result = this.gameManager.joinGame(matchResult.gameId, {
          id: playerId,
          socketId: socket.id,
          name: effectivePlayerName,
        }, { isMatchmaking: true });
        
        const player2Result = this.gameManager.joinGame(matchResult.gameId, {
          id: matchResult.opponent.playerId,
          socketId: matchResult.opponent.socketId,
          name: matchResult.opponent.playerName,
        }, { isMatchmaking: true });
        
        console.log(`🎮 Join results - Player1: ${player1Result.success}, Player2: ${player2Result.success}`);
        
        if (player1Result.success && player2Result.success) {
          // Additional safety check: ensure players aren't the same
          if (playerId === matchResult.opponent.playerId) {
            console.error(`❌ Critical error: Attempted to match player ${playerId} with themselves`);
            socket.emit('matchmaking-error', { message: 'Matchmaking error: Cannot match with yourself' });
            return;
          }
          
          socket.join(matchResult.gameId);
          socket.data.gameId = matchResult.gameId;
          
          const gameState = newGame.getState();
          
          // Send proper event that frontend expects
          socket.emit('matched-with-player', { 
            success: true,
            gameState,
            gameId: matchResult.gameId,
            playerId: playerId,
            opponentName: matchResult.opponent.playerName 
          });
          
          // Notify the opponent
          const opponentSocket = this.io?.sockets.sockets.get(matchResult.opponent.socketId);
          if (opponentSocket) {
            opponentSocket.join(matchResult.gameId);
            opponentSocket.data.gameId = matchResult.gameId;
            opponentSocket.emit('matched-with-player', { 
              success: true,
              gameState,
              gameId: matchResult.gameId,
              playerId: matchResult.opponent.playerId,
              opponentName: effectivePlayerName 
            });
            console.log(`✅ Notified opponent ${matchResult.opponent.playerName} via socket ${matchResult.opponent.socketId}`);
          } else {
            console.warn(`⚠️ Opponent socket ${matchResult.opponent.socketId} not found`);
          }
          
          socket.to(matchResult.gameId).emit('game-updated', gameState);
          await this.sendGlobalStats();
          
          console.log(`✅ Successfully matched ${effectivePlayerName} with ${matchResult.opponent.playerName} in new game ${matchResult.gameId}`);
        } else {
          console.error(`❌ Failed to join players to game - Player1: ${player1Result.success}, Player2: ${player2Result.success}`);
          socket.emit('matchmaking-error', { message: 'Failed to create game' });
        }
      } else {
        // No match found, check if player needs a new waiting room or can use existing one
        let gameIdForWaiting = matchResult.gameId;
        
        // If player doesn't have an existing waiting game, create one
        if (!existingGame || existingGame.getState().status !== 'waiting') {
          if (!gameIdForWaiting) {
            gameIdForWaiting = uuidv4();
          }
          
          const waitingGame = this.gameManager.createGame(gameIdForWaiting);
          const joinResult = this.gameManager.joinGame(gameIdForWaiting, {
            id: playerId,
            socketId: socket.id,
            name: effectivePlayerName,
          }, { isMatchmaking: true });
          
          if (joinResult.success) {
            socket.join(gameIdForWaiting);
            socket.data.gameId = gameIdForWaiting;
            
            const gameState = waitingGame.getState();
            socket.emit('game-joined', {
              success: true,
              gameState,
              gameId: gameIdForWaiting,
              playerId: playerId,
              isSpectator: false
            });
            
            // Also update the URL for the player to show their waiting room
            socket.emit('waiting-room-created', {
              gameId: gameIdForWaiting,
              message: 'Waiting room created. Looking for opponent...'
            });
            
            console.log(`🏠 Created waiting room ${gameIdForWaiting} for ${effectivePlayerName}`);
          }
        }
        
        // Add to matchmaking queue
        await this.gameManager.addToMatchmakingQueue(playerId, socket.id, effectivePlayerName, playerRank);
        
        const queueInfo = await this.gameManager.getMatchmakingQueueInfo();
        socket.emit('matchmaking-started', { 
          message: 'Looking for opponent...', 
          queuePosition: queueInfo.total 
        });
        
        console.log(`🔄 No match found, added ${effectivePlayerName} to matchmaking queue (position ${queueInfo.total})`);
      }
    } catch (error) {
      console.error('Error finding random player:', error);
      socket.emit('matchmaking-error', { message: 'Failed to find player' });
    }
  }

  private async handleCancelMatchmaking(socket: Socket): Promise<void> {
    try {
      const playerId = socket.data.playerId || socket.id;
      await this.gameManager.removeFromMatchmakingQueue(playerId);
      socket.emit('matchmaking-cancelled', { message: 'Matchmaking cancelled' });
      console.log(`🚫 Cancelled matchmaking for ${playerId}`);
    } catch (error) {
      console.error('Error cancelling matchmaking:', error);
    }
  }

  private handleDisconnect(socket: Socket): void {
    console.log('💔 Disconnected:', socket.id);
    
    const gameId = socket.data.gameId;
    if (gameId) {
      const playerId = socket.data.playerId || socket.id;
      this.gameManager.leaveGame(playerId);
      
      const game = this.gameManager.getGame(gameId);
      if (game) {
        const gameState = game.getState();
        socket.to(gameId).emit('game-updated', gameState);
      }
    }
    
    this.sendGlobalStats();
  }

  private async sendGlobalStats(socket?: Socket): Promise<void> {
    const stats = {
      activeGames: this.gameManager.getAllGames().length,
      playersOnline: this.io?.sockets.sockets.size || 0,
      queueSize: await this.gameManager.getMatchmakingQueueSize(),
      currentlyPlaying: this.getCurrentlyPlayingPlayers()
    };
    
    if (socket) {
      socket.emit('global-stats', stats);
    } else {
      // Broadcast to all connected clients
      if (this.io) {
        this.io.emit('global-stats', stats);
      }
    }
  }

  private getCurrentlyPlayingPlayers(): { playerName: string; rank?: number; gameId: string }[] {
    const playingPlayers: { playerName: string; rank?: number; gameId: string }[] = [];
    
    // Get all active games
    const games = this.gameManager.getAllGames();
    
    for (const game of games) {
      const gameState = game.getState();
      if (gameState.status === 'playing') {
        // Add both players from this game
        gameState.players.forEach(player => {
          // Try to get the socket data for more info
          const socketData = this.findSocketDataByPlayerId(player.id);
          playingPlayers.push({
            playerName: player.name || 'Unknown Player',
            rank: socketData?.player?.rank,
            gameId: gameState.id
          });
        });
      }
    }
    
    return playingPlayers;
  }

  private findSocketDataByPlayerId(playerId: string): any {
    if (!this.io) return null;
    
    for (const [socketId, socket] of this.io.sockets.sockets) {
      if (socket.data.playerId === playerId) {
        return socket.data;
      }
    }
    return null;
  }

  getIO(): SocketIOServer {
    return this.io;
  }

  cleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
} 