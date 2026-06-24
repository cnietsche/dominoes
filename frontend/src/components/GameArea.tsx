import { StartButton } from './StartButton';
import { BoneyardIndicator } from './BoneyardIndicator';
import { GameTable, TableGrid } from './GameTable';
import type { TableSide } from '../types/lobby';
import type { TablePiece } from '../types/domino';
import { hasPlayablePiece } from '../utils/dominoRules';

interface GameAreaProps {
  inProgress: boolean;
  table: TablePiece[];
  myUserId: string | null;
  currentPlayerId: string | null;
  selectedPiece: string | null;
  invalidFlash: { side: TableSide; nonce: number } | null;
  busy: boolean;
  userCount: number;
  error: string | null;
  boneyardCount: number;
  hand: string[];
  drawnThisTurn: boolean;
  canStart: boolean;
  onStart: () => void;
  onPlay: (side: TableSide) => void;
  onDrawFromBoneyard: () => void;
}

export function GameArea({
  inProgress,
  table,
  myUserId,
  currentPlayerId,
  selectedPiece,
  invalidFlash,
  busy,
  userCount,
  error,
  boneyardCount,
  hand,
  drawnThisTurn,
  canStart,
  onStart,
  onPlay,
  onDrawFromBoneyard,
}: GameAreaProps) {
  if (inProgress) {
    const isMyTurn = myUserId !== null && myUserId === currentPlayerId;
    const middlePieces = table.length > 2 ? table.slice(1, -1) : [];
    const canPlay = hasPlayablePiece(hand, table);
    const canDraw =
      isMyTurn &&
      boneyardCount > 0 &&
      !drawnThisTurn &&
      !canPlay &&
      !busy;

    return (
      <div className="flex min-h-0 w-full flex-1 flex-col">
        <TableGrid pieces={middlePieces} />
        <div className="flex shrink-0 justify-center border-b border-slate-700/80 bg-slate-900/40 px-4 py-3">
          <BoneyardIndicator
            count={boneyardCount}
            disabled={!canDraw}
            onDraw={onDrawFromBoneyard}
          />
        </div>
        <GameTable
          table={table}
          isMyTurn={isMyTurn}
          selectedPiece={selectedPiece}
          invalidFlash={invalidFlash}
          onPlayAtSide={onPlay}
        />
        {error && (
          <p className="shrink-0 px-4 pb-4 text-center text-sm text-red-300">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4">
      <StartButton
        disabled={busy || userCount < 1 || !canStart}
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
