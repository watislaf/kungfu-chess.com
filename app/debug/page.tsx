"use client";

import { useState, useEffect } from "react";
import { useSocket } from "@/lib/hooks/useSocket";
import { useAuth } from "@/lib/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoginModal } from "@/components/auth/LoginModal";

export default function DebugPage() {
  const socket = useSocket();
  const auth = useAuth({ socket: socket.socket });

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <h1 className="text-3xl font-bold text-white">Debug Page</h1>
        
        {/* Socket Connection Status */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Socket Connection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-gray-300">Status:</span>
              <Badge variant={socket.isConnected ? "default" : "destructive"}>
                {socket.isConnected ? "Connected" : "Disconnected"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-300">Socket exists:</span>
              <Badge variant={socket.socket ? "default" : "destructive"}>
                {socket.socket ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-300">Player ID:</span>
              <span className="text-white font-mono">{socket.playerId || "Not set"}</span>
            </div>
          </CardContent>
        </Card>

        {/* Authentication Status */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Authentication</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-gray-300">Authenticated:</span>
              <Badge variant={auth.isAuthenticated ? "default" : "destructive"}>
                {auth.isAuthenticated ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-300">Loading:</span>
              <Badge variant={auth.isLoading ? "default" : "secondary"}>
                {auth.isLoading ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-300">Error:</span>
              <span className="text-red-400">{auth.error || "None"}</span>
            </div>
            {auth.player && (
              <div className="text-white">
                <p>Name: {auth.player.displayName}</p>
                <p>Username: {auth.player.username}</p>
                <p>Rank: {auth.player.rank}</p>
              </div>
            )}
            {!auth.isAuthenticated && (
              <Button 
                onClick={auth.openLoginModal}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Open Login Modal
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Game Testing */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Game Testing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-gray-300">Game State:</span>
              <Badge variant={socket.gameState ? "default" : "secondary"}>
                {socket.gameState ? socket.gameState.status : "None"}
              </Badge>
            </div>
            
            {socket.gameState && (
              <div className="text-white space-y-1">
                <p>Game ID: {socket.gameState.id}</p>
                <p>Players: {socket.gameState.players.length}</p>
                <p>Status: {socket.gameState.status}</p>
                {socket.gameState.players.map((player, idx) => (
                  <p key={idx}>
                    Player {idx + 1}: {player.name} ({player.side}) - Ready: {player.isReady ? "Yes" : "No"}
                  </p>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="text-gray-300">Possible Moves:</span>
              <Badge variant={Object.keys(socket.possibleMoves).length > 0 ? "default" : "secondary"}>
                {Object.keys(socket.possibleMoves).length} pieces
              </Badge>
            </div>

            {Object.keys(socket.possibleMoves).length > 0 && (
              <div className="text-white text-sm">
                {Object.entries(socket.possibleMoves).map(([square, moves]) => (
                  <p key={square}>
                    {square}: {moves.join(", ")}
                  </p>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={() => socket.requestPossibleMoves()}
                disabled={!socket.isConnected}
                className="bg-green-600 hover:bg-green-700"
              >
                Request Possible Moves
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={auth.isLoginModalOpen}
        onClose={auth.closeLoginModal}
        onLogin={auth.login}
        onRegister={auth.register}
      />
    </div>
  );
} 