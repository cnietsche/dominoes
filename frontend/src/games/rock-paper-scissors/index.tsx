import { useCallback, useEffect, useRef } from 'react';
import { LobbyGrid } from './components/LobbyGrid';
import { LobbyConnectionInfo, LobbyGameInfo } from './components/LobbyStatus';
import { GameArea } from './components/GameArea';
import { WinnerModal } from './components/WinnerModal';
import { useLobbyWebSocket } from './hooks/useLobbyWebSocket';
import type { GameModule, GameModuleProps } from '../types';
import type { GameChoice } from './types/lobby';

function RockPaperScissorsLobby({ displayName, onExit }: GameModuleProps) {
  const {
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
    winnerNickname,
    drawPending,
    showResultModal,
    canStart,
    join,
    leave,
    startGame,
    submitChoice,
    continueToResult,
    continuedToResult,
    dismissWinner,
  } = useLobbyWebSocket();

  const joinAttemptedRef = useRef(false);

  const resultModalMessage = drawPending
    ? 'Draw'
    : winnerNickname
      ? `${winnerNickname} wins!`
      : '';

  useEffect(() => {
    if (joined || joinAttemptedRef.current || !displayName) {
      return;
    }

    joinAttemptedRef.current = true;
    join(displayName).catch(() => {
      joinAttemptedRef.current = false;
    });
  }, [displayName, joined, join]);

  const handleExit = useCallback(async () => {
    try {
      await leave();
    } finally {
      onExit();
    }
  }, [leave, onExit]);

  const handleStart = useCallback(() => {
    void startGame();
  }, [startGame]);

  const handleSelectChoice = useCallback(
    (choice: GameChoice) => {
      void submitChoice(choice);
    },
    [submitChoice],
  );

  const handleNext = useCallback(() => {
    void continueToResult();
  }, [continueToResult]);

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
              Rock Paper Scissors
            </h1>

            <button
              type="button"
              onClick={() => void handleExit()}
              disabled={busy}
              className="col-start-3 row-start-1 self-start rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 active:bg-slate-900 disabled:opacity-50"
            >
              Back
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
                <LobbyGameInfo joined={joined} />
              </div>
            )}
          </div>

          {joined && (
            <div className="mt-3 sm:mt-4">
              <LobbyGrid users={users} myUserId={myUserId} size={size} />
            </div>
          )}
        </div>
      </header>

      <main className="safe-area-x mx-auto flex w-full max-w-6xl min-h-0 flex-1 flex-col sm:px-6">
        {!joined ? (
          <div className="flex flex-1 flex-col items-center justify-center px-1 py-8 sm:py-12">
            <p className="text-slate-400">
              {error ?? (busy ? 'Joining lobby...' : 'Connecting...')}
            </p>
          </div>
        ) : (
          <GameArea
            inProgress={inProgress}
            phase={phase}
            myChoice={myChoice}
            opponentChoice={opponentChoice}
            countdownSeconds={countdownSeconds}
            busy={busy}
            userCount={users.length}
            canStart={canStart}
            error={error}
            onStart={handleStart}
            onSelectChoice={handleSelectChoice}
            onNext={handleNext}
            continuedToResult={continuedToResult}
          />
        )}
      </main>

      {joined && showResultModal && resultModalMessage && (
        <WinnerModal message={resultModalMessage} onDismiss={dismissWinner} />
      )}
    </div>
  );
}

const rockPaperScissorsModule: GameModule = {
  Component: RockPaperScissorsLobby,
};

export default rockPaperScissorsModule;
