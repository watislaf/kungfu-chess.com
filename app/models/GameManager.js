"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameManager = void 0;
const Game_1 = require("./Game");
class GameManager {
    constructor() {
        this.games = new Map();
        this.playerToGame = new Map();
    }
    createGame(gameId) {
        const game = new Game_1.Game(gameId);
        this.games.set(gameId, game);
        return game;
    }
    getGame(gameId) {
        return this.games.get(gameId);
    }
    joinGame(gameId, player) {
        let game = this.games.get(gameId);
        if (!game) {
            game = this.createGame(gameId);
        }
        const result = game.addPlayer(player);
        if (result.success) {
            this.playerToGame.set(player.id, gameId);
        }
        return result;
    }
    leaveGame(playerId) {
        const gameId = this.playerToGame.get(playerId);
        if (gameId) {
            const game = this.games.get(gameId);
            if (game) {
                game.removePlayer(playerId);
                // Remove game if no players left
                if (game.getPlayerCount() === 0) {
                    this.games.delete(gameId);
                }
            }
            this.playerToGame.delete(playerId);
        }
    }
    getGameByPlayerId(playerId) {
        const gameId = this.playerToGame.get(playerId);
        return gameId ? this.games.get(gameId) : undefined;
    }
    getAllGames() {
        return Array.from(this.games.values());
    }
}
exports.GameManager = GameManager;
