import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { GameState, GameSettings, PieceCooldown } from '@/app/models/Game';
import { Square } from 'chess.js';

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  gameState: (GameState & { board: (any[] | null)[] }) | null;
  playerId: string;
  isSpectator: boolean;
  possibleMoves: { [square: string]: string[] };
  pieceCooldowns: PieceCooldown[];
  movesLeft: number;
  isMatchmaking: boolean;
  joinGame: (gameId: string, playerName?: string) => void;
  leaveGame: () => void;
  switchSides: () => void;
  startGame: () => void;
  setGameSettings: (settings: GameSettings) => void;
  makeMove: (from: Square, to: Square, promotion?: string) => void;
  requestPossibleMoves: () => void;
  findRandomPlayer: (playerName?: string) => void;
  cancelMatchmaking: () => void;
  restartGame: () => void;
}

export function useSocket(): UseSocketReturn {
  const router = useRouter();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [gameState, setGameState] = useState<(GameState & { board: (any[] | null)[] }) | null>(null);
  const [playerId, setPlayerId] = useState<string>('');
  const [isSpectator, setIsSpectator] = useState<boolean>(false);
  const [possibleMoves, setPossibleMoves] = useState<{ [square: string]: string[] }>({});
  const [pieceCooldowns, setPieceCooldowns] = useState<PieceCooldown[]>([]);
  const [movesLeft, setMovesLeft] = useState<number>(0);
  const [isMatchmaking, setIsMatchmaking] = useState<boolean>(false);
  const prevGameStateRef = useRef<(GameState & { board: (any[] | null)[] }) | null>(null);
  const hasShownConnectedToast = useRef(false);

  useEffect(() => {
    // Determine connection URL based on environment
    let serverUrl: string | undefined;
    
    if (typeof window !== 'undefined') {
      const socketIOUrl = process.env.NEXT_PUBLIC_SOCKETIO_URL;
      
      if (socketIOUrl) {
        serverUrl = socketIOUrl;
      } else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        // Local development - use HTTP
        serverUrl = 'http://localhost:3001';
      } else {
        // Production - always use the same protocol as the current page
        const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
        const port = window.location.protocol === 'https:' ? '' : ':3001';
        serverUrl = `${protocol}//${window.location.hostname}${port}`;
      }
    }
    
    const newSocket = serverUrl ? io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      // For HTTPS/WSS connections, ensure secure transport
      secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
      // Disable upgrade for polling initially, let Socket.IO handle it
      upgrade: true,
      // Add path to match ALB configuration
      path: '/socket.io/'
    }) : io({
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000
    });
    
    setSocket(newSocket);

    // Connection events
    newSocket.on('connect', () => {
      setIsConnected(true);
      if (!hasShownConnectedToast.current) {
        toast.success('Connected to game server');
        hasShownConnectedToast.current = true;
      }
    });

    newSocket.on('disconnect', (reason) => {
      setIsConnected(false);
      hasShownConnectedToast.current = false;
    });

    newSocket.on('connect_error', (error) => {
      if (!hasShownConnectedToast.current) {
        toast.error('Failed to connect to game server');
      }
    });

    // Game events
    newSocket.on('game-joined', (data: {
      success: boolean;
      gameState?: GameState & { board: (any[] | null)[] };
      playerId?: string;
      isSpectator?: boolean;
      message?: string;
    }) => {
      if (data.success) {
        setGameState(data.gameState!);
        setPlayerId(data.playerId!);
        setIsSpectator(data.isSpectator || false);
        toast.dismiss();
        
        if (data.isSpectator) {
          toast.info('Joined as spectator');
        } else {
          toast.success('Joined game successfully');
        }
      } else {
        toast.dismiss();
        toast.error(data.message || 'Failed to join game');
      }
    });

    newSocket.on('game-updated', (updatedGameState: GameState & { board: (any[] | null)[] }) => {
      const prevState = prevGameStateRef.current;
      prevGameStateRef.current = updatedGameState;
      setGameState(updatedGameState);
      
      if (prevState && updatedGameState.players.length > prevState.players.length) {
        const newPlayer = updatedGameState.players.find(p => 
          !prevState.players.some(pp => pp.id === p.id)
        );
        if (newPlayer) {
          toast.info(`${newPlayer.name} joined the game`);
        }
      }
      
      if (prevState?.status === 'waiting' && updatedGameState.status === 'settings') {
        toast.info('Both players connected! Configure game settings');
      }
      
      if (prevState?.status === 'settings' && updatedGameState.status === 'playing') {
        toast.success('Game started! Good luck!');
      }
    });

    newSocket.on('game-started', (startedGameState: GameState & { board: (any[] | null)[] }) => {
      prevGameStateRef.current = startedGameState;
      setGameState(startedGameState);
      toast.success('Game started! Good luck!');
    });

    newSocket.on('player-left', (data) => {
      toast.warning(`${data.playerName} left the game`);
    });

    newSocket.on('sides-switched', (updatedGameState: GameState & { board: (any[] | null)[] }) => {
      prevGameStateRef.current = updatedGameState;
      setGameState(updatedGameState);
      toast.info('Sides switched');
    });

    newSocket.on('move-error', (data: { message: string }) => {
      toast.error(data.message);
    });

    newSocket.on('possible-moves', (data: {
      possibleMoves: { [square: string]: string[] };
      pieceCooldowns: PieceCooldown[];
      movesLeft: number;
    }) => {
      setPossibleMoves(data.possibleMoves);
      setPieceCooldowns(data.pieceCooldowns.map((pc) => ({
        ...pc,
        availableAt: new Date(pc.availableAt)
      })));
      setMovesLeft(data.movesLeft);
    });

    newSocket.on('game-ended', (data: {
      winner?: string;
      reason: string;
      surrenderedBy?: string;
      surrenderedByName?: string;
      disconnectedBy?: string;
      disconnectedByName?: string;
    }) => {
      if (data.surrenderedBy && data.surrenderedByName) {
        if (data.surrenderedBy === playerId) {
          toast.info(`You surrendered. Game ended.`);
        } else {
          toast.success(`${data.surrenderedByName} surrendered. You win!`);
        }
      } else if (data.disconnectedBy && data.disconnectedByName) {
        if (data.disconnectedBy === playerId) {
          toast.info(`You disconnected. Game ended.`);
        } else {
          toast.success(`${data.disconnectedByName} disconnected. You win!`);
        }
      } else if (data.winner) {
        toast.success(`Game ended! Winner: ${data.reason}`);
      } else {
        toast.info(`Game ended in ${data.reason}`);
      }
    });

    // Matchmaking events
    newSocket.on('matchmaking-started', (data: { message: string; queuePosition: number }) => {
      setIsMatchmaking(true);
      toast.info(`${data.message} (${data.queuePosition} player${data.queuePosition !== 1 ? 's' : ''} in queue)`);
    });

    newSocket.on('matchmaking-cancelled', (data: { message: string }) => {
      setIsMatchmaking(false);
      toast.info(data.message);
    });

    newSocket.on('matchmaking-error', (data: { message: string }) => {
      setIsMatchmaking(false);
      toast.error(data.message);
    });

    newSocket.on('matched-with-player', (data: {
      success: boolean;
      gameState: GameState & { board: (any[] | null)[] };
      gameId: string;
      playerId?: string;
      opponentName?: string;
    }) => {
      setIsMatchmaking(false);
      if (data.success) {
        setGameState(data.gameState);
        if (data.playerId) {
          setPlayerId(data.playerId);
        }
        toast.success(`Matched with ${data.opponentName || 'a player'}! Starting game...`);
        
        router.push(`/game?id=${data.gameId}`);
      }
    });

    newSocket.on('waiting-room-created', (data: {
      gameId: string;
      message: string;
    }) => {
      router.push(`/game?id=${data.gameId}`);
      toast.info(data.message);
    });

    newSocket.on('game-restarted', (data: {
      restartedBy: string;
      playerName?: string;
    }) => {
      if (data.restartedBy === playerId) {
        toast.success('Game restarted!');
      } else {
        toast.info(`${data.playerName || 'Player'} restarted the game`);
      }
    });

    return () => {
      newSocket.close();
    };
  }, [router]);

  const joinGame = useCallback((gameId: string, playerName?: string) => {
    if (!socket || !isConnected) {
      return;
    }
    socket.emit('join-game', { gameId, playerName });
  }, [socket, isConnected]);

  const leaveGame = useCallback(() => {
    if (socket) {
      socket.emit('leave-game');
    }
  }, [socket]);

  const switchSides = useCallback(() => {
    if (socket && !isSpectator) {
      socket.emit('switch-sides');
    } else if (isSpectator) {
      toast.error('Spectators cannot change game settings');
    }
  }, [socket, isSpectator]);

  const startGame = useCallback(() => {
    if (socket && !isSpectator) {
      socket.emit('player-ready');
      toast.info('Marked as ready');
    } else if (isSpectator) {
      toast.error('Spectators cannot change game settings');
    }
  }, [socket, isSpectator]);

  const setGameSettings = useCallback((settings: GameSettings) => {
    if (socket && !isSpectator) {
      socket.emit('set-game-settings', settings);
    } else if (isSpectator) {
      toast.error('Spectators cannot change game settings');
    }
  }, [socket, isSpectator]);

  const makeMove = useCallback((from: Square, to: Square, promotion?: string) => {
    if (socket && !isSpectator) {
      socket.emit('make-move', { from, to, promotion });
    } else if (isSpectator) {
      toast.error('Spectators cannot make moves');
    }
  }, [socket, isSpectator]);

  const requestPossibleMoves = useCallback(() => {
    if (socket && !isSpectator) {
      socket.emit('request-possible-moves');
    }
  }, [socket, isSpectator]);

  const findRandomPlayer = useCallback((playerName?: string) => {
    if (socket && !isSpectator && isConnected) {
      socket.emit('find-random-player', { playerName });
    } else if (!isConnected) {
      toast.error('Not connected to server. Please wait for connection.');
    }
  }, [socket, isSpectator, isConnected]);

  const cancelMatchmaking = useCallback(() => {
    if (socket && !isSpectator) {
      socket.emit('cancel-matchmaking');
    }
  }, [socket, isSpectator]);

  const restartGame = useCallback(() => {
    if (socket && !isSpectator) {
      socket.emit('restart-game');
    } else if (isSpectator) {
      toast.error('Spectators cannot restart games');
    }
  }, [socket, isSpectator]);

  return {
    socket,
    isConnected,
    gameState,
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
  };
} 