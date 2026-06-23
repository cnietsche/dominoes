import { StartButton } from './StartButton';
import { GameTable } from './GameTable';
import type { TableSide } from '../types/lobby';

interface GameAreaProps {
  inProgress: boolean;
  table: string[];
  myUserId: string | null;
  currentPlayerId: string | null;
  selectedPiece: string | null;
  busy: boolean;
  userCount: number;
  error: string | null;
  onStart: () => void;
  onPlay: (side: TableSide) => void;
}

export function GameArea({
  inProgress,
  table,
  myUserId,
  currentPlayerId,
  selectedPiece,
  busy,
  userCount,
  error,
  onStart,
  onPlay,
}: GameAreaProps) {
  if (inProgress) {
    const isMyTurn = myUserId !== null && myUserId === currentPlayerId;

    return (
      <div className="flex w-full flex-col items-center gap-4">
        <GameTable
          table={table}
          isMyTurn={isMyTurn}
          selectedPiece={selectedPiece}
          onPlayLeft={() => onPlay('LEFT')}
          onPlayRight={() => onPlay('RIGHT')}
        />
        {error && (
          <p className="max-w-sm rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}
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
