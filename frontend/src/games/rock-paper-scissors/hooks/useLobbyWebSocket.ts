import { useCallback, useEffect, useRef, useState } from 'react';
import type { IncomingMessage, LobbyStatePayload, OutgoingMessage } from '../types/lobby';

const WS_PROTOCOL = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const WS_URL = `${WS_PROTOCOL}//${window.location.host}/ws/rock-paper-scissors/lobby`;

type PendingResolver = {
  resolve: (message: IncomingMessage) => void;
  reject: (error: Error) => void;
  expectedTypes: string[];
};

function parseLobbyState(payload: Record<string, unknown>): LobbyStatePayload {
  const users = Array.isArray(payload.users)
    ? (payload.users as LobbyStatePayload['users'])
    : [];
  return {
    lobbyId: String(payload.lobbyId ?? ''),
    size: Number(payload.size ?? 0),
    users,
  };
}

export function useLobbyWebSocket() {
  const [users, setUsers] = useState<LobbyStatePayload['users']>([]);
  const [size, setSize] = useState(2);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [joined, setJoined] = useState(false);
  const [busy, setBusy] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const pendingRef = useRef<PendingResolver | null>(null);
  const joinedRef = useRef(false);

  const applyLobbyState = useCallback((payload: Record<string, unknown>) => {
    const state = parseLobbyState(payload);
    setUsers(state.users);
    if (state.size > 0) {
      setSize(state.size);
    }
  }, []);

  const handleIncomingMessage = useCallback(
    (message: IncomingMessage) => {
      if (message.type === 'LOBBY_STATE') {
        applyLobbyState(message.payload);
      }

      const pending = pendingRef.current;
      if (pending && pending.expectedTypes.includes(message.type)) {
        pendingRef.current = null;
        pending.resolve(message);
        return;
      }

      if (message.type === 'ERROR' && !pending) {
        setError(String(message.payload.message ?? 'Unknown error.'));
      }
    },
    [applyLobbyState],
  );

  const sendMessage = useCallback(
    (outgoing: OutgoingMessage, expectedTypes: string[]): Promise<IncomingMessage> => {
      const run = async () => {
        const ws = wsRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN) {
          throw new Error('WebSocket is not connected.');
        }

        setBusy(true);
        setError(null);

        const responsePromise = new Promise<IncomingMessage>((resolve, reject) => {
          pendingRef.current = { resolve, reject, expectedTypes };
        });

        ws.send(JSON.stringify(outgoing));

        try {
          const response = await responsePromise;
          if (response.type === 'ERROR') {
            const message = String(response.payload.message ?? 'Unknown error.');
            setError(message);
            throw new Error(message);
          }
          return response;
        } finally {
          setBusy(false);
        }
      };

      const chained = queueRef.current.then(run, run);
      queueRef.current = chained.then(
        () => undefined,
        () => undefined,
      );
      return chained;
    },
    [],
  );

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        resolve();
      };

      ws.onerror = () => {
        setConnected(false);
        reject(new Error('Failed to connect to the lobby.'));
      };

      ws.onclose = () => {
        setConnected(false);
        setJoined(false);
        joinedRef.current = false;
        setMyUserId(null);
        pendingRef.current?.reject(new Error('Connection closed.'));
        pendingRef.current = null;
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data as string) as IncomingMessage;
        handleIncomingMessage(message);
      };
    });
  }, [handleIncomingMessage]);

  const join = useCallback(
    async (nickname: string) => {
      await connect();
      const response = await sendMessage(
        { type: 'JOIN', nickname },
        ['JOIN_ACK', 'ERROR'],
      );
      if (response.type === 'JOIN_ACK') {
        const userId = String(response.payload.userId ?? '');
        setMyUserId(userId);
        setJoined(true);
        joinedRef.current = true;
        setError(null);
      }
    },
    [connect, sendMessage],
  );

  const leave = useCallback(async () => {
    if (!joinedRef.current) {
      return;
    }
    try {
      await sendMessage({ type: 'LEAVE' }, ['LOBBY_STATE', 'ERROR']);
    } finally {
      joinedRef.current = false;
      setJoined(false);
      setMyUserId(null);
      wsRef.current?.close();
      wsRef.current = null;
    }
  }, [sendMessage]);

  useEffect(() => {
    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, []);

  return {
    users,
    size,
    myUserId,
    error,
    connected,
    joined,
    busy,
    join,
    leave,
  };
}
