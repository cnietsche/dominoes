import { useCallback, useEffect, useState } from 'react';
import * as authApi from '../api/authApi';
import type { LoginRequest, PlayerDto, RegisterRequest } from '../types/auth';

const TOKEN_KEY = 'auth_token';
const PLAYER_KEY = 'auth_player';

function loadStoredAuth(): { token: string; player: PlayerDto } | null {
  const token = localStorage.getItem(TOKEN_KEY);
  const playerJson = localStorage.getItem(PLAYER_KEY);

  if (!token || !playerJson) {
    return null;
  }

  try {
    const player = JSON.parse(playerJson) as PlayerDto;
    return { token, player };
  } catch {
    return null;
  }
}

function saveAuth(token: string, player: PlayerDto) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(PLAYER_KEY, JSON.stringify(player));
}

function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(PLAYER_KEY);
}

export function useAuth() {
  const [player, setPlayer] = useState<PlayerDto | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = loadStoredAuth();

    if (!stored) {
      setLoading(false);
      return;
    }

    authApi
      .getMe(stored.token)
      .then((validatedPlayer) => {
        setToken(stored.token);
        setPlayer(validatedPlayer);
        saveAuth(stored.token, validatedPlayer);
      })
      .catch(() => {
        clearAuth();
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const register = useCallback(async (request: RegisterRequest) => {
    setError(null);
    await authApi.register(request);
  }, []);

  const login = useCallback(async (request: LoginRequest) => {
    setError(null);
    const response = await authApi.login(request);
    const { token: newToken, id, name } = response;
    const loggedPlayer: PlayerDto = { id, name };

    saveAuth(newToken, loggedPlayer);
    setToken(newToken);
    setPlayer(loggedPlayer);
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setToken(null);
    setPlayer(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleError = useCallback((err: unknown) => {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    setError(message);
  }, []);

  return {
    player,
    token,
    loading,
    error,
    isAuthenticated: player !== null && token !== null,
    register,
    login,
    logout,
    clearError,
    handleError,
  };
}
