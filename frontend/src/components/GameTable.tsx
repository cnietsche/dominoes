import { DominoPiece } from './DominoPiece';
import type { TablePiece } from '../types/domino';
import type { TableSide } from '../types/lobby';

interface GameTableProps {
  table: TablePiece[];
  isMyTurn: boolean;
  selectedPiece: string | null;
  invalidFlash: { side: TableSide; nonce: number } | null;
  onPlayLeft: () => void;
  onPlayRight: () => void;
}

function PlayButton({
  side,
  label,
  invalidFlash,
  onClick,
}: {
  side: TableSide;
  label: string;
  invalidFlash: { side: TableSide; nonce: number } | null;
  onClick: () => void;
}) {
  const isFlashing = invalidFlash?.side === side;

  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      key={isFlashing ? `flash-${invalidFlash.nonce}` : side}
      className={[
        'h-[88px] w-[44px] shrink-0 self-center rounded-lg transition',
        isFlashing ? 'animate-flash-invalid' : 'bg-blue-600 hover:bg-blue-500',
      ].join(' ')}
    />
  );
}

export function GameTable({
  table,
  isMyTurn,
  selectedPiece,
  invalidFlash,
  onPlayLeft,
  onPlayRight,
}: GameTableProps) {
  const canPlay = isMyTurn && selectedPiece !== null;

  return (
    <div className="flex w-full items-center justify-center gap-2 overflow-x-auto py-4">
      {canPlay ? (
        <PlayButton
          side="LEFT"
          label="Jogar à esquerda"
          invalidFlash={invalidFlash}
          onClick={onPlayLeft}
        />
      ) : (
        <div className="h-[88px] w-[44px] shrink-0" />
      )}

      <div className="flex items-center gap-0">
        {table.map((piece, index) => (
          <DominoPiece
            key={`${piece.code}-${index}`}
            code={piece.code}
            rotation={piece.rotation}
          />
        ))}
      </div>

      {canPlay ? (
        <PlayButton
          side="RIGHT"
          label="Jogar à direita"
          invalidFlash={invalidFlash}
          onClick={onPlayRight}
        />
      ) : (
        <div className="h-[88px] w-[44px] shrink-0" />
      )}
    </div>
  );
}
