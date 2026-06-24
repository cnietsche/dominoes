import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  GameStatePayload,
  IncomingMessage,
  LobbyStatePayload,
  LobbyUser,
  OutgoingMessage,
  TablePiecePayload,
  TableSide,
} from '../types/lobby';
import type { PieceRotation, TablePiece } from '../types/domino';

const WS_URL = `ws://${window.location.host}/ws/lobby`;

type PendingResolver = {
  resolve: (message: IncomingMessage) => void;
  reject: (error: Error) => void;
  expectedTypes: string[];
};

function parseLobbyState(payload: Record<string, unknown>): LobbyStatePayload {
  const users = Array.isArray(payload.users)
    ? (payload.users as LobbyUser[])
    : [];
  return {
    lobbyId: String(payload.lobbyId ?? ''),
    size: Number(payload.size ?? 0),
    users,
  };
}

const VALID_ROTATIONS: PieceRotation[] = [
  'VERTICAL',
  'HORIZONTAL',
  'HORIZONTAL_FLIPPED',
];

function parseTablePiece(raw: unknown): TablePiece | null {
  if (typeof raw === 'string') {
    return { code: raw, rotation: 'VERTICAL' };
  }
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }
  const piece = raw as TablePiecePayload;
  const code = typeof piece.code === 'string' ? piece.code : '';
  const rotation = VALID_ROTATIONS.includes(piece.rotation as PieceRotation)
    ? (piece.rotation as PieceRotation)
    : 'HORIZONTAL';
  if (!code) {
    return null;
  }
  return { code, rotation };
}

function parseGameState(payload: Record<string, unknown>): GameStatePayload {
  const hand = Array.isArray(payload.hand)
    ? (payload.hand as string[])
    : [];
  const table = Array.isArray(payload.table)
    ? payload.table
        .map(parseTablePiece)
        .filter((piece): piece is TablePiece => piece !== null)
    : [];
  const currentPlayerRaw = payload.currentPlayer;
  const currentPlayer =
    typeof currentPlayerRaw === 'string' && currentPlayerRaw.length > 0
      ? currentPlayerRaw
      : null;
  const winnerIdRaw = payload.winnerId;
  const winnerId =
    typeof winnerIdRaw === 'string' && winnerIdRaw.length > 0
      ? winnerIdRaw
      : null;
  const winnerNicknameRaw = payload.winnerNickname;
  const winnerNickname =
    typeof winnerNicknameRaw === 'string' && winnerNicknameRaw.length > 0
      ? winnerNicknameRaw
      : null;
  return {
    inProgress: Boolean(payload.inProgress),
    boneyardCount: Number(payload.boneyardCount ?? 0),
    hand,
    currentPlayer,
    table,
    drawnThisTurn: Boolean(payload.drawnThisTurn),
    winnerId,
    winnerNickname,
    drawPending: Boolean(payload.drawPending),
    canStart: payload.canStart !== undefined ? Boolean(payload.canStart) : true,
    showResultModal: Boolean(payload.showResultModal),
  };
}

export function useLobbyWebSocket() {
  const [users, setUsers] = useState<LobbyUser[]>([]);
  const [size, setSize] = useState(4);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [joined, setJoined] = useState(false);
  const [busy, setBusy] = useState(false);
  const [inProgress, setInProgress] = useState(false);
  const [boneyardCount, setBoneyardCount] = useState(0);
  const [hand, setHand] = useState<string[]>([]);
  const [table, setTable] = useState<TablePiece[]>([]);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [drawnThisTurn, setDrawnThisTurn] = useState(false);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [winnerNickname, setWinnerNickname] = useState<string | null>(null);
  const [canStart, setCanStart] = useState(true);
  const [showResultModal, setShowResultModal] = useState(false);
  const [drawPending, setDrawPending] = useState(false);

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
    setBoneyardCount(state.boneyardCount);
    setHand(state.hand);
    setTable(state.table);
    setCurrentPlayerId(state.currentPlayer);
    setDrawnThisTurn(state.drawnThisTurn);
    setWinnerId(state.winnerId);
    setWinnerNickname(state.winnerNickname);
    setDrawPending(state.drawPending);
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
        setError(String(message.payload.message ?? 'Erro desconhecido.'));
      }
    },
    [applyLobbyState, applyGameState],
  );

  const sendMessage = useCallback(
    (outgoing: OutgoingMessage, expectedTypes: string[]): Promise<IncomingMessage> => {
      const run = async () => {
        const ws = wsRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN) {
          throw new Error('WebSocket não está conectado.');
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
            const message = String(response.payload.message ?? 'Erro desconhecido.');
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
        reject(new Error('Falha ao conectar ao lobby.'));
      };

      ws.onclose = () => {
        setConnected(false);
        setJoined(false);
        joinedRef.current = false;
        setMyUserId(null);
        setInProgress(false);
        setBoneyardCount(0);
        setHand([]);
        setTable([]);
        setCurrentPlayerId(null);
        setDrawnThisTurn(false);
        setWinnerId(null);
        setWinnerNickname(null);
        setCanStart(true);
        setShowResultModal(false);
        setDrawPending(false);
        pendingRef.current?.reject(new Error('Conexão encerrada.'));
        pendingRef.current = null;
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data) as IncomingMessage;
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

  const endGame = useCallback(async () => {
    await sendMessage({ type: 'END_GAME' }, ['END_GAME_ACK', 'ERROR']);
    setError(null);
  }, [sendMessage]);

  const playPiece = useCallback(
    async (piece: string, side: TableSide) => {
      await sendMessage(
        { type: 'PLAY_PIECE', piece, side },
        ['PLAY_PIECE_ACK', 'ERROR'],
      );
      setError(null);
    },
    [sendMessage],
  );

  const drawFromBoneyard = useCallback(async () => {
    await sendMessage(
      { type: 'DRAW_FROM_BONEYARD' },
      ['DRAW_FROM_BONEYARD_ACK', 'ERROR'],
    );
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
    boneyardCount,
    hand,
    table,
    currentPlayerId,
    drawnThisTurn,
    winnerId,
    winnerNickname,
    drawPending,
    canStart,
    showResultModal,
    join,
    leave,
    startGame,
    endGame,
    playPiece,
    drawFromBoneyard,
    dismissWinner,
    clearError,
  };
}
