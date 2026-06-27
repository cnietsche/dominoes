import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  GameChoice,
  GamePhase,
  GameStatePayload,
  IncomingMessage,
  LobbyStatePayload,
  OutgoingMessage,
} from '../types/lobby';

const WS_PROTOCOL = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const WS_URL = `${WS_PROTOCOL}//${window.location.host}/ws/rock-paper-scissors/lobby`;

type PendingResolver = {
  resolve: (message: IncomingMessage) => void;
  reject: (error: Error) => void;
  expectedTypes: string[];
};

const VALID_CHOICES: GameChoice[] = ['rock', 'paper', 'scissors'];

function parseChoice(value: unknown): GameChoice | null {
  if (typeof value !== 'string') {
    return null;
  }
  return VALID_CHOICES.includes(value as GameChoice) ? (value as GameChoice) : null;
}

function parsePhase(value: unknown): GamePhase {
  if (value === 'choosing' || value === 'countdown' || value === 'reveal') {
    return value;
  }
  return '';
}

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

function parseGameState(payload: Record<string, unknown>): GameStatePayload {
  const countdownEndsAtRaw = payload.countdownEndsAt;
  const countdownEndsAt =
    typeof countdownEndsAtRaw === 'string' && countdownEndsAtRaw.length > 0
      ? countdownEndsAtRaw
      : null;
  const winnerIdRaw = payload.winnerId;
  const winnerId =
    typeof winnerIdRaw === 'string' && winnerIdRaw.length > 0 ? winnerIdRaw : null;
  const winnerNicknameRaw = payload.winnerNickname;
  const winnerNickname =
    typeof winnerNicknameRaw === 'string' && winnerNicknameRaw.length > 0
      ? winnerNicknameRaw
      : null;

  return {
    inProgress: Boolean(payload.inProgress),
    phase: parsePhase(payload.phase),
    myChoice: parseChoice(payload.myChoice),
    opponentChoice: parseChoice(payload.opponentChoice),
    countdownEndsAt,
    winnerId,
    winnerNickname,
    drawPending: Boolean(payload.drawPending),
    continuedToResult: Boolean(payload.continuedToResult),
    canStart: payload.canStart !== undefined ? Boolean(payload.canStart) : true,
    showResultModal: Boolean(payload.showResultModal),
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
  const [inProgress, setInProgress] = useState(false);
  const [phase, setPhase] = useState<GamePhase>('');
  const [myChoice, setMyChoice] = useState<GameChoice | null>(null);
  const [opponentChoice, setOpponentChoice] = useState<GameChoice | null>(null);
  const [countdownEndsAt, setCountdownEndsAt] = useState<string | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [winnerNickname, setWinnerNickname] = useState<string | null>(null);
  const [canStart, setCanStart] = useState(true);
  const [showResultModal, setShowResultModal] = useState(false);
  const [drawPending, setDrawPending] = useState(false);
  const [continuedToResult, setContinuedToResult] = useState(false);

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

  const applyGameState = useCallback((payload: Record<string, unknown>) => {
    const state = parseGameState(payload);
    setInProgress(state.inProgress);
    setPhase(state.phase);
    setMyChoice(state.myChoice);
    setOpponentChoice(state.opponentChoice);
    setCountdownEndsAt(state.countdownEndsAt);
    setWinnerId(state.winnerId);
    setWinnerNickname(state.winnerNickname);
    setDrawPending(state.drawPending);
    setContinuedToResult(state.continuedToResult);
    setCanStart(state.canStart);
    setShowResultModal(state.showResultModal);
  }, []);

  const handleIncomingMessage = useCallback(
    (message: IncomingMessage) => {
      if (message.type === 'LOBBY_STATE') {
        applyLobbyState(message.payload);
      }

      if (message.type === 'GAME_STATE') {
        applyGameState(message.payload);
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
    [applyLobbyState, applyGameState],
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
        setInProgress(false);
        setPhase('');
        setMyChoice(null);
        setOpponentChoice(null);
        setCountdownEndsAt(null);
        setCountdownSeconds(null);
        setWinnerId(null);
        setWinnerNickname(null);
        setCanStart(true);
        setShowResultModal(false);
        setDrawPending(false);
        setContinuedToResult(false);
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
    await sendMessage({ type: 'LEAVE' }, ['LOBBY_STATE']);
    setJoined(false);
    joinedRef.current = false;
    setMyUserId(null);
  }, [sendMessage]);

  const startGame = useCallback(async () => {
    await sendMessage({ type: 'START_GAME' }, ['START_GAME_ACK', 'ERROR']);
    setError(null);
  }, [sendMessage]);

  const submitChoice = useCallback(
    async (choice: GameChoice) => {
      await sendMessage(
        { type: 'SUBMIT_CHOICE', choice },
        ['SUBMIT_CHOICE_ACK', 'ERROR'],
      );
      setError(null);
    },
    [sendMessage],
  );

  const continueToResult = useCallback(async () => {
    await sendMessage({ type: 'CONTINUE_TO_RESULT' }, ['CONTINUE_TO_RESULT_ACK', 'ERROR']);
    setError(null);
  }, [sendMessage]);

  const dismissWinner = useCallback(() => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'DISMISS_WINNER' }));
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    if (phase !== 'countdown' || !countdownEndsAt) {
      setCountdownSeconds(null);
      return;
    }

    const updateCountdown = () => {
      const remainingMs = new Date(countdownEndsAt).getTime() - Date.now();
      const seconds = Math.max(1, Math.ceil(remainingMs / 1000));
      setCountdownSeconds(remainingMs <= 0 ? null : seconds);
    };

    updateCountdown();
    const intervalId = window.setInterval(updateCountdown, 100);
    return () => window.clearInterval(intervalId);
  }, [phase, countdownEndsAt]);

  useEffect(() => {
    const handlePageHide = () => {
      if (joinedRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'LEAVE' }));
      }
    };

    window.addEventListener('pagehide', handlePageHide);
    return () => {
      window.removeEventListener('pagehide', handlePageHide);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
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
    inProgress,
    phase,
    myChoice,
    opponentChoice,
    countdownSeconds,
    winnerId,
    winnerNickname,
    drawPending,
    continuedToResult,
    canStart,
    showResultModal,
    join,
    leave,
    startGame,
    submitChoice,
    continueToResult,
    dismissWinner,
    clearError,
  };
}
