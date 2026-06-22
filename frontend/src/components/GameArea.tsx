import { StartButton } from './StartButton';

interface GameAreaProps {
  inProgress: boolean;
  boneyardCount: number;
  userCount: number;
  busy: boolean;
  error: string | null;
  onStart: () => void;
}

export function GameArea({
  inProgress,
  boneyardCount,
  userCount,
  busy,
  error,
  onStart,
}: GameAreaProps) {
  if (inProgress) {
    return (
      <div className="text-center">
        <p className="text-sm uppercase tracking-wide text-slate-400">Peças no monte</p>
        <p className="mt-2 text-6xl font-bold text-white">{boneyardCount}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <StartButton
        disabled={busy || userCount < 1}
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
