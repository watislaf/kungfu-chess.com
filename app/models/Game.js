"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = void 0;
const chess_js_1 = require("chess.js");
class Game {
    constructor(id) {
        this.state = {
            id,
            players: [],
            spectators: [],
            status: 'waiting',
            createdAt: new Date(),
            bothPlayersReady: false,
            settings: {
                maxMovesPerPeriod: 3,
                pieceCooldownSeconds: 5,
            },
            moveHistory: [],
            pieceCooldowns: [],
            playerMoveHistory: [],
        };
        this.chess = new chess_js_1.Chess();
    }
    addPlayer(player) {
        if (this.state.players.length >= 2) {
            const spectator = {
                id: player.id,
                socketId: player.socketId,
                name: player.name,
                joinedAt: new Date(),
            };
            this.state.spectators.push(spectator);
            return { success: true, isSpectator: true };
        }
        // Assign side based on player count
        const side = this.state.players.length === 0 ? 'white' : 'black';
        const newPlayer = {
            ...player,
            side,
            isReady: false,
        };
        this.state.players.push(newPlayer);
        // Update status when both players are present - go to settings phase
        if (this.state.players.length === 2) {
            this.state.status = 'settings';
        }
        return { success: true, isSpectator: false };
    }
    removePlayer(playerId) {
        this.state.players = this.state.players.filter(p => p.id !== playerId);
        this.state.spectators = this.state.spectators.filter(s => s.id !== playerId);
        if (this.state.players.length < 2) {
            this.state.status = 'waiting';
            this.state.bothPlayersReady = false;
        }
        // Reassign sides if needed
        if (this.state.players.length === 1) {
            this.state.players[0].side = 'white';
            this.state.players[0].isReady = false;
        }
    }
    switchSides() {
        if (this.state.players.length !== 2 || this.state.status !== 'settings') {
            return false;
        }
        // Switch the sides
        const [player1, player2] = this.state.players;
        player1.side = player1.side === 'white' ? 'black' : 'white';
        player2.side = player2.side === 'white' ? 'black' : 'white';
        // Reset ready states when sides are switched
        player1.isReady = false;
        player2.isReady = false;
        this.state.bothPlayersReady = false;
        return true;
    }
    setGameSettings(settings) {
        if (this.state.status !== 'settings') {
            return false;
        }
        this.state.settings = settings;
        return true;
    }
    setPlayerReady(playerId) {
        const player = this.state.players.find(p => p.id === playerId);
        if (!player || this.state.status !== 'settings') {
            return false;
        }
        player.isReady = true;
        // Check if both players are ready
        this.state.bothPlayersReady = this.state.players.length === 2 &&
            this.state.players.every(p => p.isReady);
        if (this.state.bothPlayersReady && this.state.settings) {
            this.state.status = 'playing';
            this.state.fen = this.chess.fen();
            // No specific turn in this variant - both players can move
            this.state.currentTurn = undefined;
        }
        return true;
    }
    isSpectator(userId) {
        return this.state.spectators.some(s => s.id === userId);
    }
    getSpectatorCount() {
        return this.state.spectators.length;
    }
    getState() {
        return {
            ...this.state,
            settings: this.state.settings ? { ...this.state.settings } : undefined
        };
    }
    getPlayerCount() {
        return this.state.players.length;
    }
    isGameReady() {
        return this.state.players.length === 2;
    }
    canStart() {
        return this.state.bothPlayersReady;
    }
    getPlayerBySide(side) {
        return this.state.players.find(p => p.side === side);
    }
    makeMove(playerId, from, to, promotion) {
        if (this.state.status !== 'playing' || !this.state.settings) {
            return { success: false, message: 'Game is not in playing state' };
        }
        const player = this.state.players.find(p => p.id === playerId);
        if (!player) {
            return { success: false, message: 'Player not found' };
        }
        // Check if piece is on cooldown
        const now = new Date();
        const pieceCooldown = this.state.pieceCooldowns.find(pc => pc.square === from && pc.playerId === playerId && pc.availableAt > now);
        if (pieceCooldown) {
            const remainingSeconds = Math.ceil((pieceCooldown.availableAt.getTime() - now.getTime()) / 1000);
            return {
                success: false,
                message: `Piece on cooldown for ${remainingSeconds} more seconds`
            };
        }
        // Check move rate limit (N moves per 10 seconds)
        const tenSecondsAgo = new Date(now.getTime() - 10000);
        const recentMoves = this.state.playerMoveHistory.filter(pmh => pmh.playerId === playerId && pmh.timestamp > tenSecondsAgo);
        if (recentMoves.length >= this.state.settings.maxMovesPerPeriod) {
            return {
                success: false,
                message: `Move limit exceeded: ${this.state.settings.maxMovesPerPeriod} moves per 10 seconds`
            };
        }
        // Check if the piece belongs to the player
        const piece = this.chess.get(from);
        if (!piece) {
            return { success: false, message: 'No piece at source square' };
        }
        const pieceColor = piece.color === 'w' ? 'white' : 'black';
        if (pieceColor !== player.side) {
            return { success: false, message: 'Cannot move opponent\'s piece' };
        }
        // Attempt the move
        try {
            const move = this.chess.move({ from, to, promotion: promotion || 'q' });
            if (!move) {
                return { success: false, message: 'Invalid move' };
            }
            // Update game state
            this.state.fen = this.chess.fen();
            this.state.moveHistory.push(move);
            // Add piece cooldown
            const cooldownEnd = new Date(now.getTime() + this.state.settings.pieceCooldownSeconds * 1000);
            this.state.pieceCooldowns.push({
                square: from,
                playerId,
                availableAt: cooldownEnd
            });
            // Add to player move history
            this.state.playerMoveHistory.push({
                playerId,
                timestamp: now
            });
            // Clean up old cooldowns and move history
            this.cleanupOldData();
            // Check for game end
            this.checkGameEnd();
            return { success: true, move };
        }
        catch (error) {
            return { success: false, message: 'Illegal chess move' };
        }
    }
    cleanupOldData() {
        const now = new Date();
        const tenSecondsAgo = new Date(now.getTime() - 10000);
        // Remove expired cooldowns
        this.state.pieceCooldowns = this.state.pieceCooldowns.filter(pc => pc.availableAt > now);
        // Remove old move history (keep only last 10 seconds)
        this.state.playerMoveHistory = this.state.playerMoveHistory.filter(pmh => pmh.timestamp > tenSecondsAgo);
    }
    checkGameEnd() {
        if (this.chess.isGameOver()) {
            this.state.status = 'finished';
            if (this.chess.isCheckmate()) {
                // The player who just moved wins
                const lastMove = this.state.moveHistory[this.state.moveHistory.length - 1];
                const winnerColor = lastMove.color === 'w' ? 'white' : 'black';
                this.state.winner = this.state.players.find(p => p.side === winnerColor)?.id;
                this.state.gameEndReason = 'checkmate';
            }
            else if (this.chess.isStalemate()) {
                this.state.gameEndReason = 'stalemate';
            }
            else if (this.chess.isDraw()) {
                this.state.gameEndReason = 'draw';
            }
        }
    }
    getPossibleMoves(playerId) {
        if (this.state.status !== 'playing') {
            return {};
        }
        const player = this.state.players.find(p => p.id === playerId);
        if (!player) {
            return {};
        }
        const possibleMoves = {};
        const now = new Date();
        // Get all squares with player's pieces
        for (let rank = 1; rank <= 8; rank++) {
            for (let file = 'a'; file <= 'h'; file = String.fromCharCode(file.charCodeAt(0) + 1)) {
                const square = `${file}${rank}`;
                const piece = this.chess.get(square);
                if (piece && (piece.color === 'w' ? 'white' : 'black') === player.side) {
                    // Check if piece is on cooldown
                    const isOnCooldown = this.state.pieceCooldowns.some(pc => pc.square === square && pc.playerId === playerId && pc.availableAt > now);
                    if (!isOnCooldown) {
                        try {
                            const moves = this.chess.moves({ square, verbose: true });
                            possibleMoves[square] = moves.map(m => m.to);
                        }
                        catch {
                            possibleMoves[square] = [];
                        }
                    }
                    else {
                        possibleMoves[square] = [];
                    }
                }
            }
        }
        return possibleMoves;
    }
    getPlayerMoveCount(playerId) {
        const tenSecondsAgo = new Date(Date.now() - 10000);
        return this.state.playerMoveHistory.filter(pmh => pmh.playerId === playerId && pmh.timestamp > tenSecondsAgo).length;
    }
    getPieceCooldowns(playerId) {
        const now = new Date();
        return this.state.pieceCooldowns.filter(pc => pc.playerId === playerId && pc.availableAt > now);
    }
}
exports.Game = Game;
