import type { GameChoice } from '../types/lobby';
import { choiceIcon } from './ChoiceButtons';

interface RevealBoardProps {
  myChoice: GameChoice;
  opponentChoice: GameChoice;
  busy: boolean;
  nextDisabled: boolean;
  onNext: () => void;
}

export function RevealBoard({
  myChoice,
  opponentChoice,
  busy,
  nextDisabled,
  onNext,
}: RevealBoardProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-between py-8 sm:py-12">
      <div className="flex flex-col items-center gap-3">
        <p className="text-sm font-medium uppercase tracking-wide text-slate-400">
          Opponent
        </p>
        <div className="flex h-32 w-32 items-center justify-center rounded-2xl border-2 border-slate-600 bg-slate-800/80 p-4 sm:h-36 sm:w-36">
          <img
            src={choiceIcon(opponentChoice)}
            alt={opponentChoice}
            className="h-full w-full object-contain"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={busy || nextDisabled}
        className="min-h-12 rounded-xl bg-emerald-600 px-8 py-3 text-base font-semibold text-white shadow-lg transition hover:bg-emerald-500 active:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next
      </button>

      <div className="flex flex-col items-center gap-3">
        <p className="text-sm font-medium uppercase tracking-wide text-slate-400">
          You
        </p>
        <div className="flex h-32 w-32 items-center justify-center rounded-2xl border-2 border-emerald-500/60 bg-slate-800/80 p-4 sm:h-36 sm:w-36">
          <img
            src={choiceIcon(myChoice)}
            alt={myChoice}
            className="h-full w-full object-contain"
          />
        </div>
      </div>
    </div>
  );
}
