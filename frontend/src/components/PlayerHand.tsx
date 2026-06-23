import type { TablePiece } from '../types/domino';
import { canPlayPiece } from '../utils/dominoRules';

interface PlayerHandProps {
  pieces: string[];
  table: TablePiece[];
  isMyTurn: boolean;
  selectedPiece: string | null;
  onSelectPiece: (piece: string) => void;
}

export function PlayerHand({
  pieces,
  table,
  isMyTurn,
  selectedPiece,
  onSelectPiece,
}: PlayerHandProps) {
  return (
    <div className="flex min-h-[100px] w-full items-center justify-center gap-2 overflow-x-auto border-t border-slate-700 bg-slate-900/80 px-6 py-4">
      {pieces.map((piece, index) => {
        const isPlayable = isMyTurn && canPlayPiece(piece, table);
        const isSelected = selectedPiece === piece;

        let interactionClass = 'cursor-default opacity-70';
        if (isMyTurn) {
          interactionClass = isPlayable
            ? 'cursor-pointer'
            : 'cursor-not-allowed opacity-40';
        }

        const className = [
          'h-[88px] w-[44px] shrink-0 rounded',
          interactionClass,
          isSelected ? 'ring-2 ring-blue-400' : '',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <button
            key={`${piece}-${index}`}
            type="button"
            disabled={!isPlayable}
            onClick={() => onSelectPiece(piece)}
            className={className}
            aria-label={`Peça ${piece}${isPlayable ? '' : ' (não jogável)'}`}
            aria-pressed={isSelected}
            aria-disabled={!isPlayable}
          >
            <img
              src={`/dominoes/${piece}.png`}
              alt=""
              width={44}
              height={88}
              className="pointer-events-none h-[88px] w-[44px]"
            />
          </button>
        );
      })}
    </div>
  );
}
