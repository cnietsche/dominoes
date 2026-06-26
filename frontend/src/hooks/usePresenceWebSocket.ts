import { useEffect, useRef, useState } from 'react';

export interface GameLobbyInfo {
  count: number;
  max: number;
  min: number;
}

export interface PresenceStats {
  libraryCount: number;
  gameLobbies: Record<string, GameLobbyInfo>;
  total: number;
}

const INITIAL_STATS: PresenceStats = {
  libraryCount: 0,
  gameLobbies: {},
  total: 0,
};

const WS_PROTOCOL = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const MAX_BACKOFF_MS = 30_000;

function parseGameLobbyInfo(value: unknown): GameLobbyInfo | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const lobby = value as Record<string, unknown>;
  if (
    typeof lobby.count !== 'number' ||
    typeof lobby.max !== 'number' ||
    typeof lobby.min !== 'number'
  ) {
    return null;
  }

  return { count: lobby.count, max: lobby.max, min: lobby.min };
}

function parsePresenceStats(payload: unknown): PresenceStats | null {
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }

  const message = payload as Record<string, unknown>;
  if (message.type !== 'PRESENCE_STATS') {
    return null;
  }

  const gameLobbiesRaw = message.gameLobbies;
  const gameLobbies: Record<string, GameLobbyInfo> = {};
  if (typeof gameLobbiesRaw === 'object' && gameLobbiesRaw !== null) {
    for (const [key, value] of Object.entries(gameLobbiesRaw)) {
      const lobby = parseGameLobbyInfo(value);
      if (lobby) {
        gameLobbies[key] = lobby;
      }
    }
  }

  return {
    libraryCount: typeof message.libraryCount === 'number' ? message.libraryCount : 0,
    gameLobbies,
    total: typeof message.total === 'number' ? message.total : 0,
  };
}

export function usePresenceWebSocket(token: string) {
  const [stats, setStats] = useState<PresenceStats>(INITIAL_STATS);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backoffRef = useRef(1_000);

  useEffect(() => {
    let cancelled = false;

    const clearReconnectTimeout = () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    const scheduleReconnect = (connect: () => void) => {
      clearReconnectTimeout();
      reconnectTimeoutRef.current = setTimeout(() => {
        if (!cancelled) {
          connect();
        }
      }, backoffRef.current);
      backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF_MS);
    };

    const connect = () => {
      if (cancelled) {
        return;
      }

      const ws = new WebSocket(
        `${WS_PROTOCOL}//${window.location.host}/ws/presence?token=${encodeURIComponent(token)}`,
      );
      wsRef.current = ws;

      ws.onopen = () => {
        if (cancelled) {
          ws.close();
          return;
        }
        setConnected(true);
        backoffRef.current = 1_000;
      };

      ws.onmessage = (event) => {
        try {
          const parsed = parsePresenceStats(JSON.parse(event.data as string));
          if (parsed) {
            setStats(parsed);
          }
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = () => {
        setConnected(false);
        wsRef.current = null;
        if (!cancelled) {
          scheduleReconnect(connect);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    const handlePageHide = () => {
      wsRef.current?.close();
    };

    connect();
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      cancelled = true;
      window.removeEventListener('pagehide', handlePageHide);
      clearReconnectTimeout();
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [token]);

  return { ...stats, connected };
}
