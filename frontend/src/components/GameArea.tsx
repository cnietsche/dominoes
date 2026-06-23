import { StartButton } from './StartButton';

interface GameAreaProps {
  inProgress: boolean;
  userCount: number;
  busy: boolean;
  error: string | null;
  onStart: () => void;
}

export function GameArea({
  inProgress,
  userCount,
  busy,
  error,
  onStart,
}: GameAreaProps) {
  if (inProgress) {
    return null;
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
