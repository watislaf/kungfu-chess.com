import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { GameState, GameSettings, PieceCooldown } from '@/app/models/Game';
import { Square } from 'chess.js';

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  gameState: GameState | null;
  playerId: string;
  isSpectator: boolean;
  possibleMoves: { [square: string]: string[] };
  pieceCooldowns: PieceCooldown[];
  movesLeft: number;
  joinGame: (gameId: string, playerName?: string) => void;
  leaveGame: () => void;
  switchSides: () => void;
  startGame: () => void;
  setGameSettings: (settings: GameSettings) => void;
  makeMove: (from: Square, to: Square) => void;
  requestPossibleMoves: () => void;
}

export function useSocket(): UseSocketReturn {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerId, setPlayerId] = useState<string>('');
  const [isSpectator, setIsSpectator] = useState(false);
  const [possibleMoves, setPossibleMoves] = useState<{ [square: string]: string[] }>({});
  const [pieceCooldowns, setPieceCooldowns] = useState<PieceCooldown[]>([]);
  const [movesLeft, setMovesLeft] = useState(0);
  const prevGameStateRef = useRef<GameState | null>(null);
  const hasShownConnectedToast = useRef(false);
  const [lastSettingsUpdate, setLastSettingsUpdate] = useState<{
    settings: GameSettings;
    playerId: string;
    playerName: string;
  } | null>(null);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io();
    setSocket(newSocket);

    // Connection events
    newSocket.on('connect', () => {
      setIsConnected(true);
      if (!hasShownConnectedToast.current) {
        toast.success('Connected to game server');
        hasShownConnectedToast.current = true;
      }
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      toast.error('Disconnected from server');
      hasShownConnectedToast.current = false;
    });

    newSocket.on('connect_error', (error) => {
      toast.error('Connection failed');
    });

    // Game events
    newSocket.on('game-joined', (data) => {
      if (data.success) {
        setGameState(data.gameState);
        setPlayerId(data.playerId);
        setIsSpectator(data.isSpectator || false);
        toast.dismiss();
        
        if (data.isSpectator) {
          toast.info('Joined as spectator - you can watch the game');
        } else {
          toast.success('Joined game successfully');
        }
      } else {
        toast.dismiss();
        toast.error(data.message || 'Failed to join game');
      }
    });

    newSocket.on('game-updated', (updatedGameState: GameState) => {
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
      
      if (prevState && updatedGameState.spectators.length > prevState.spectators.length) {
        const newSpectatorCount = updatedGameState.spectators.length - prevState.spectators.length;
        if (newSpectatorCount > 0) {
          toast.info(`${newSpectatorCount} spectator${newSpectatorCount > 1 ? 's' : ''} joined`);
        }
      }
      
      if (prevState?.status === 'waiting' && updatedGameState.status === 'settings') {
        toast.info('Both players connected! Configure game settings');
      }
      
      if (prevState?.status === 'settings' && updatedGameState.status === 'playing') {
        toast.success('Game started! Good luck!');
      }
    });

    newSocket.on('game-started', (startedGameState: GameState) => {
      prevGameStateRef.current = startedGameState;
      setGameState(startedGameState);
      toast.success('Game started! Good luck!');
    });

    newSocket.on('player-left', (data) => {
      toast.warning(`${data.playerName} left the game`);
    });

    newSocket.on('sides-switched', (updatedGameState: GameState) => {
      prevGameStateRef.current = updatedGameState;
      setGameState(updatedGameState);
      toast.info('Sides switched');
    });

    // Chess-specific events
    newSocket.on('settings-updated', (data: { 
      settings: GameSettings; 
      playerId: string; 
      playerName: string; 
    }) => {
      setLastSettingsUpdate(data);
    });

    newSocket.on('move-made', (data: {
      playerId: string;
      playerName: string;
      move: any;
      from: string;
      to: string;
    }) => {
      // Only show toast for opponent moves, not our own
      // We'll check this when we have the current playerId
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
    }) => {
      if (data.winner) {
        toast.success(`Game ended! Winner: ${data.reason}`);
      } else {
        toast.info(`Game ended in ${data.reason}`);
      }
    });

    return () => {
      newSocket.close();
    };
  }, []);

  // Handle settings update notifications
  useEffect(() => {
    if (lastSettingsUpdate && playerId) {
      if (lastSettingsUpdate.playerId === playerId) {
        // Don't show toast for own updates to avoid spam
      } else {
        toast.info(`${lastSettingsUpdate.playerName} updated game settings`);
      }
    }
  }, [lastSettingsUpdate, playerId]);

  const joinGame = useCallback((gameId: string, playerName?: string) => {
    if (socket) {
      socket.emit('join-game', { gameId, playerName });
      toast.loading('Joining game...', { id: 'joining' });
    }
  }, [socket]);

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
      socket.emit('set-game-settings', { settings });
    } else if (isSpectator) {
      toast.error('Spectators cannot change game settings');
    }
  }, [socket, isSpectator]);

  const makeMove = useCallback((from: Square, to: Square) => {
    if (socket && !isSpectator) {
      socket.emit('make-move', { from, to });
    } else if (isSpectator) {
      toast.error('Spectators cannot make moves');
    }
  }, [socket, isSpectator]);

  const requestPossibleMoves = useCallback(() => {
    if (socket && !isSpectator) {
      socket.emit('get-possible-moves');
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
    joinGame,
    leaveGame,
    switchSides,
    startGame,
    setGameSettings,
    makeMove,
    requestPossibleMoves,
  };
} 