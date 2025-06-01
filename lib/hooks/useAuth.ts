"use client";

import { useState, useEffect, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { PlayerProfile, LoginCredentials, RegisterData } from '@/app/models/Player';

interface UseAuthProps {
  socket: Socket | null;
}

interface AuthState {
  isAuthenticated: boolean;
  player: PlayerProfile | null;
  isLoading: boolean;
  error: string | null;
  sessionToken?: string;
}

// Helper functions for localStorage persistence
const AUTH_STORAGE_KEY = 'rapid-chess-auth';

interface StoredAuthData {
  isAuthenticated: boolean;
  player: PlayerProfile | null;
  sessionToken?: string;
}

const saveAuthToStorage = (authData: StoredAuthData) => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
    }
  } catch (error) {
    console.warn('Failed to save auth data to localStorage:', error);
  }
};

const loadAuthFromStorage = (): StoredAuthData | null => {
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects if player exists
        if (parsed.player) {
          parsed.player.createdAt = new Date(parsed.player.createdAt);
          parsed.player.lastLoginAt = new Date(parsed.player.lastLoginAt);
        }
        return parsed;
      }
    }
  } catch (error) {
    console.warn('Failed to load auth data from localStorage:', error);
  }
  return null;
};

const clearAuthFromStorage = () => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch (error) {
    console.warn('Failed to clear auth data from localStorage:', error);
  }
};

export function useAuth({ socket }: UseAuthProps) {
  // Initialize state with data from localStorage if available
  const [authState, setAuthState] = useState<AuthState>(() => {
    const storedAuth = loadAuthFromStorage();
    return {
      isAuthenticated: storedAuth?.isAuthenticated || false,
      player: storedAuth?.player || null,
    isLoading: false,
    error: null,
    sessionToken: storedAuth?.sessionToken,
    };
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [hasValidatedSession, setHasValidatedSession] = useState(false);

  // On socket connection, validate stored authentication with server (only once per connection)
  useEffect(() => {
    if (!socket || !authState.isAuthenticated || !authState.player || !authState.sessionToken || hasValidatedSession) return;

    console.log('🔍 Validating stored session token for player:', authState.player.displayName);
    // Validate stored session with server using secure token
    socket.emit('auth:validate-session', { sessionToken: authState.sessionToken });
    setHasValidatedSession(true);
  }, [socket, authState.isAuthenticated, authState.player?.id, authState.sessionToken, hasValidatedSession]);

  // Reset validation flag when socket disconnects
  useEffect(() => {
    if (!socket) {
      setHasValidatedSession(false);
    }
  }, [socket]);

  // Listen to authentication events
  useEffect(() => {
    if (!socket) return;

    const handleLoginResponse = (response: { success: boolean; message?: string; player?: PlayerProfile; sessionToken?: string }) => {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      
      if (response.success && response.player && response.sessionToken) {
        const newAuthState = {
          ...authState,
          isAuthenticated: true,
          player: response.player,
          sessionToken: response.sessionToken,
          error: null,
        };
        setAuthState(newAuthState);
        
        // Save to localStorage with session token
        saveAuthToStorage({
          isAuthenticated: true,
          player: response.player,
          sessionToken: response.sessionToken
        });
        
        setIsLoginModalOpen(false);
        console.log('✅ Login successful:', response.player.displayName);
      } else {
        setAuthState(prev => ({
          ...prev,
          error: response.message || 'Login failed',
        }));
      }
    };

    const handleRegisterResponse = (response: { success: boolean; message?: string; player?: PlayerProfile; sessionToken?: string }) => {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      
      if (response.success && response.player && response.sessionToken) {
        const newAuthState = {
          ...authState,
          isAuthenticated: true,
          player: response.player,
          sessionToken: response.sessionToken,
          error: null,
        };
        setAuthState(newAuthState);
        
        // Save to localStorage with session token
        saveAuthToStorage({
          isAuthenticated: true,
          player: response.player,
          sessionToken: response.sessionToken
        });
        
        setIsLoginModalOpen(false);
        console.log('✅ Registration successful:', response.player.displayName);
      } else {
        setAuthState(prev => ({
          ...prev,
          error: response.message || 'Registration failed',
        }));
      }
    };

    const handleLogoutResponse = () => {
      setAuthState({
        isAuthenticated: false,
        player: null,
        isLoading: false,
        error: null,
      });
      
      // Clear localStorage
      clearAuthFromStorage();
      
      setIsProfileModalOpen(false);
      console.log('👋 Logout successful');
    };

    const handleSessionValidationResponse = (response: { valid: boolean; player?: PlayerProfile }) => {
      if (!response.valid) {
        // Session is invalid, clear stored data
        setAuthState({
          isAuthenticated: false,
          player: null,
          isLoading: false,
          error: null,
        });
        clearAuthFromStorage();
        console.log('❌ Stored session is invalid, logging out');
      } else if (response.player) {
        // Update player data if provided
        setAuthState(prev => ({
          ...prev,
          player: response.player!,
        }));
        saveAuthToStorage({
          isAuthenticated: true,
          player: response.player
        });
      }
    };

    const handleProfileResponse = (response: { success: boolean; message?: string; player?: PlayerProfile }) => {
      if (response.success && response.player) {
        setAuthState(prev => ({
          ...prev,
          player: response.player!,
        }));
        
        // Update localStorage with latest player data
        saveAuthToStorage({
          isAuthenticated: true,
          player: response.player
        });
      }
    };

    socket.on('auth:login-response', handleLoginResponse);
    socket.on('auth:register-response', handleRegisterResponse);
    socket.on('auth:logout-response', handleLogoutResponse);
    socket.on('auth:session-validation-response', handleSessionValidationResponse);
    socket.on('auth:profile-response', handleProfileResponse);

    return () => {
      socket.off('auth:login-response', handleLoginResponse);
      socket.off('auth:register-response', handleRegisterResponse);
      socket.off('auth:logout-response', handleLogoutResponse);
      socket.off('auth:session-validation-response', handleSessionValidationResponse);
      socket.off('auth:profile-response', handleProfileResponse);
    };
  }, [socket]);

  const login = useCallback(async (credentials: LoginCredentials): Promise<{ success: boolean; message?: string }> => {
    if (!socket) {
      return { success: false, message: 'No connection available' };
    }

    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    return new Promise((resolve) => {
      const handleResponse = (response: { success: boolean; message?: string; player?: PlayerProfile }) => {
        socket.off('auth:login-response', handleResponse);
        resolve({ success: response.success, message: response.message });
      };
      
      socket.on('auth:login-response', handleResponse);
      socket.emit('auth:login', credentials);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        socket.off('auth:login-response', handleResponse);
        setAuthState(prev => ({ ...prev, isLoading: false }));
        resolve({ success: false, message: 'Login timeout' });
      }, 10000);
    });
  }, [socket]);

  const register = useCallback(async (data: RegisterData): Promise<{ success: boolean; message?: string }> => {
    if (!socket) {
      return { success: false, message: 'No connection available' };
    }

    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    return new Promise((resolve) => {
      const handleResponse = (response: { success: boolean; message?: string; player?: PlayerProfile }) => {
        socket.off('auth:register-response', handleResponse);
        resolve({ success: response.success, message: response.message });
      };
      
      socket.on('auth:register-response', handleResponse);
      socket.emit('auth:register', data);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        socket.off('auth:register-response', handleResponse);
        setAuthState(prev => ({ ...prev, isLoading: false }));
        resolve({ success: false, message: 'Registration timeout' });
      }, 10000);
    });
  }, [socket]);

  const logout = useCallback(() => {
    if (!socket) return;
    
    socket.emit('auth:logout');
  }, [socket]);

  const refreshProfile = useCallback(() => {
    if (!socket || !authState.isAuthenticated) return;
    
    socket.emit('auth:get-profile');
  }, [socket, authState.isAuthenticated]);

  const openLoginModal = useCallback(() => {
    setIsLoginModalOpen(true);
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  const closeLoginModal = useCallback(() => {
    setIsLoginModalOpen(false);
    setAuthState(prev => ({ ...prev, error: null, isLoading: false }));
  }, []);

  const openProfileModal = useCallback(() => {
    if (authState.isAuthenticated) {
      refreshProfile(); // Refresh profile data when opening
      setIsProfileModalOpen(true);
    }
  }, [authState.isAuthenticated, refreshProfile]);

  const closeProfileModal = useCallback(() => {
    setIsProfileModalOpen(false);
  }, []);

  return {
    // Auth state
    isAuthenticated: authState.isAuthenticated,
    player: authState.player,
    isLoading: authState.isLoading,
    error: authState.error,

    // Auth actions
    login,
    register,
    logout,
    refreshProfile,

    // Modal state
    isLoginModalOpen,
    isProfileModalOpen,
    openLoginModal,
    closeLoginModal,
    openProfileModal,
    closeProfileModal,
  };
} 