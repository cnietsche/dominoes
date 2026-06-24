import { useCallback, useEffect, useRef, useState } from 'react';
import { NicknameForm } from './components/NicknameForm';
import { LobbyGrid } from './components/LobbyGrid';
import { LobbyConnectionInfo, LobbyGameInfo } from './components/LobbyStatus';
import { GameArea } from './components/GameArea';
import { PlayerHand } from './components/PlayerHand';
import { WinnerModal } from './components/WinnerModal';
import { useLobbyWebSocket } from './hooks/useLobbyWebSocket';
import type { TableSide } from './types/lobby';
import { canPlayPiece, canPlayPieceOnSide } from './utils/dominoRules';

const FLASH_DURATION_MS = 500;

function App() {
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

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="safe-area-top safe-area-x border-b border-slate-700 bg-slate-900/80 py-3 backdrop-blur sm:py-4">
        <div className="mx-auto max-w-6xl sm:px-6">
          <div
            className={`grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-2 ${
              joined ? 'grid-rows-[auto_auto]' : 'grid-rows-[auto]'
            }`}
          >
            <h1 className="col-start-1 row-start-1 min-w-0 self-start text-lg font-bold text-white sm:text-xl">
              Lobby Online
            </h1>

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
            <div className="w-full max-w-md space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-white sm:text-2xl">Entrar no lobby</h2>
                <p className="mt-2 text-sm text-slate-400 sm:text-base">
                  Informe um nickname para ocupar um slot na sala.
                </p>
              </div>
              <NicknameForm
                onSubmit={join}
                disabled={busy}
                error={error}
              />
            </div>
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

export default App;
