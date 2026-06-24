import { useCallback, useEffect, useRef, useState } from 'react';
import { LobbyGrid } from './components/LobbyGrid';
import { LobbyConnectionInfo, LobbyGameInfo } from './components/LobbyStatus';
import { GameArea } from './components/GameArea';
import { PlayerHand } from './components/PlayerHand';
import { WinnerModal } from './components/WinnerModal';
import { useLobbyWebSocket } from './hooks/useLobbyWebSocket';
import type { GameModule, GameModuleProps } from '../types';
import type { TableSide } from './types/lobby';
import { canPlayPiece, canPlayPieceOnSide } from './utils/dominoRules';

const FLASH_DURATION_MS = 500;

function DominoesLobby({ displayName, onExit }: GameModuleProps) {
  const {
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
    join,
    leave,
    startGame,
    endGame,
    playPiece,
    drawFromBoneyard,
    dismissWinner,
    clearError,
    winnerNickname,
    drawPending,
    showResultModal,
    canStart,
  } = useLobbyWebSocket();

  const joinAttemptedRef = useRef(false);

  const resultModalMessage = drawPending
    ? 'Empate'
    : winnerNickname
      ? `${winnerNickname} venceu!`
      : '';

  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
  const [invalidFlash, setInvalidFlash] = useState<{
    side: TableSide;
    nonce: number;
  } | null>(null);
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isMyTurn = myUserId !== null && myUserId === currentPlayerId;

  useEffect(() => {
    if (joined || joinAttemptedRef.current || !displayName) {
      return;
    }

    joinAttemptedRef.current = true;
    join(displayName).catch(() => {
      joinAttemptedRef.current = false;
    });
  }, [displayName, joined, join]);

  useEffect(() => {
    if (
      selectedPiece &&
      isMyTurn &&
      !canPlayPiece(selectedPiece, table)
    ) {
      setSelectedPiece(null);
    }
  }, [selectedPiece, isMyTurn, table]);

  const flashInvalid = useCallback((side: TableSide) => {
    if (flashTimeoutRef.current) {
      clearTimeout(flashTimeoutRef.current);
    }
    setInvalidFlash({ side, nonce: Date.now() });
    flashTimeoutRef.current = setTimeout(() => {
      setInvalidFlash(null);
      flashTimeoutRef.current = null;
    }, FLASH_DURATION_MS);
  }, []);

  const handleSelectPiece = useCallback(
    (piece: string) => {
      if (!isMyTurn || !canPlayPiece(piece, table)) {
        return;
      }
      setSelectedPiece((current) => (current === piece ? null : piece));
    },
    [isMyTurn, table],
  );

  const handlePlay = useCallback(
    async (side: TableSide) => {
      if (!selectedPiece || !isMyTurn) {
        return;
      }
      if (!canPlayPieceOnSide(selectedPiece, table, side)) {
        flashInvalid(side);
        return;
      }
      try {
        await playPiece(selectedPiece, side);
        setSelectedPiece(null);
      } catch {
        flashInvalid(side);
        clearError();
      }
    },
    [selectedPiece, isMyTurn, table, playPiece, flashInvalid, clearError],
  );

  const handleExit = useCallback(async () => {
    try {
      await leave();
    } finally {
      onExit();
    }
  }, [leave, onExit]);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="safe-area-top safe-area-x border-b border-slate-700 bg-slate-900/80 py-3 backdrop-blur sm:py-4">
        <div className="mx-auto max-w-6xl sm:px-6">
          <div
            className={`grid grid-cols-[minmax(0,1fr)_auto_auto] gap-x-3 gap-y-2 ${
              joined ? 'grid-rows-[auto_auto]' : 'grid-rows-[auto]'
            }`}
          >
            <h1 className="col-start-1 row-start-1 min-w-0 self-start text-lg font-bold text-white sm:text-xl">
              Dominoes
            </h1>

            <button
              type="button"
              onClick={() => void handleExit()}
              disabled={busy}
              className="col-start-3 row-start-1 self-start rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 active:bg-slate-900 disabled:opacity-50"
            >
              Voltar
            </button>

            <div
              className={`col-start-2 row-start-1 self-start ${joined ? 'row-span-2' : ''}`}
            >
              <LobbyConnectionInfo
                connected={connected}
                userCount={users.length}
                size={size}
              />
            </div>

            {joined && (
              <div className="col-start-1 row-start-2 min-w-0 self-start">
                <LobbyGameInfo
                  joined={joined}
                  inProgress={inProgress}
                  busy={busy}
                  onEndGame={endGame}
                />
              </div>
            )}
          </div>

          {joined && (
            <div className="mt-3 sm:mt-4">
              <LobbyGrid
                users={users}
                myUserId={myUserId}
                currentPlayerId={currentPlayerId}
                inProgress={inProgress}
                size={size}
              />
            </div>
          )}
        </div>
      </header>

      <main className="safe-area-x mx-auto flex w-full max-w-6xl min-h-0 flex-1 flex-col sm:px-6">
        {!joined ? (
          <div className="flex flex-1 flex-col items-center justify-center px-1 py-8 sm:py-12">
            <p className="text-slate-400">
              {error ?? (busy ? 'Entrando no lobby...' : 'Conectando...')}
            </p>
          </div>
        ) : (
          <GameArea
            inProgress={inProgress}
            table={table}
            myUserId={myUserId}
            currentPlayerId={currentPlayerId}
            selectedPiece={selectedPiece}
            invalidFlash={invalidFlash}
            busy={busy}
            userCount={users.length}
            error={error}
            boneyardCount={boneyardCount}
            hand={hand}
            drawnThisTurn={drawnThisTurn}
            canStart={canStart}
            onStart={startGame}
            onPlay={handlePlay}
            onDrawFromBoneyard={drawFromBoneyard}
          />
        )}
      </main>

      {joined && inProgress && (
        <footer className="safe-area-bottom mt-auto">
          <PlayerHand
            pieces={hand}
            table={table}
            isMyTurn={isMyTurn}
            selectedPiece={selectedPiece}
            onSelectPiece={handleSelectPiece}
          />
        </footer>
      )}

      {joined && showResultModal && resultModalMessage && (
        <WinnerModal
          message={resultModalMessage}
          onDismiss={dismissWinner}
        />
      )}
    </div>
  );
}

const dominoesModule: GameModule = {
  Component: DominoesLobby,
};

export default dominoesModule;
