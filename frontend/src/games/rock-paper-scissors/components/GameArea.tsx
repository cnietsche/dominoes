import { StartButton } from './StartButton';
import { ChoiceButtons } from './ChoiceButtons';
import { CountdownDisplay } from './CountdownDisplay';
import { RevealBoard } from './RevealBoard';
import type { GameChoice, GamePhase } from '../types/lobby';

interface GameAreaProps {
  inProgress: boolean;
  phase: GamePhase;
  myChoice: GameChoice | null;
  opponentChoice: GameChoice | null;
  countdownSeconds: number | null;
  busy: boolean;
  userCount: number;
  canStart: boolean;
  error: string | null;
  onStart: () => void;
  onSelectChoice: (choice: GameChoice) => void;
  onNext: () => void;
  continuedToResult: boolean;
}

export function GameArea({
  inProgress,
  phase,
  myChoice,
  opponentChoice,
  countdownSeconds,
  busy,
  userCount,
  canStart,
  error,
  onStart,
  onSelectChoice,
  onNext,
  continuedToResult,
}: GameAreaProps) {
  if (inProgress && phase === 'reveal' && myChoice && opponentChoice) {
    return (
      <div className="flex min-h-0 w-full flex-1 flex-col">
        <RevealBoard
          myChoice={myChoice}
          opponentChoice={opponentChoice}
          busy={busy}
          nextDisabled={continuedToResult}
          onNext={onNext}
        />
        {error && (
          <p className="shrink-0 px-4 pb-4 text-center text-sm text-red-300">
            {error}
          </p>
        )}
      </div>
    );
  }

  if (inProgress && (phase === 'choosing' || phase === 'countdown')) {
    return (
      <div className="relative flex min-h-0 w-full flex-1 flex-col items-center justify-center px-2 py-6 sm:py-8">
        <ChoiceButtons
          selectedChoice={myChoice}
          disabled={busy}
          onSelect={onSelectChoice}
        />
        {phase === 'countdown' && countdownSeconds !== null && (
          <CountdownDisplay seconds={countdownSeconds} />
        )}
        {error && (
          <p className="mt-4 max-w-sm rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-2 py-6 sm:py-8">
      <StartButton
        disabled={busy || userCount < 2 || !canStart}
        onClick={onStart}
      />
      {error && (
        <p className="max-w-sm rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
