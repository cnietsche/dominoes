import { useCallback, useEffect, useRef, useState } from 'react';
import { NicknameForm } from './components/NicknameForm';
import { LobbyGrid } from './components/LobbyGrid';
import { LobbyStatus } from './components/LobbyStatus';
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
    showWinnerModal,
    canStart,
  } = useLobbyWebSocket();

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
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-700 bg-slate-900/80 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-xl font-bold text-white">Lobby Online</h1>
            <LobbyStatus
              userCount={users.length}
              size={size}
              connected={connected}
              joined={joined}
              inProgress={inProgress}
              busy={busy}
              onEndGame={endGame}
            />
          </div>
          <LobbyGrid
            users={users}
            myUserId={myUserId}
            currentPlayerId={currentPlayerId}
            inProgress={inProgress}
          />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl min-h-0 flex-1 flex-col px-6">
        {!joined ? (
          <div className="flex flex-1 flex-col items-center justify-center py-12">
            <div className="w-full max-w-md space-y-6 text-center">
              <div>
                <h2 className="text-2xl font-semibold text-white">Entrar no lobby</h2>
                <p className="mt-2 text-slate-400">
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
        <footer className="mt-auto">
          <PlayerHand
            pieces={hand}
            table={table}
            isMyTurn={isMyTurn}
            selectedPiece={selectedPiece}
            onSelectPiece={handleSelectPiece}
          />
        </footer>
      )}

      {joined && showWinnerModal && winnerNickname && (
        <WinnerModal
          winnerNickname={winnerNickname}
          onDismiss={dismissWinner}
        />
      )}
    </div>
  );
}

export default App;
