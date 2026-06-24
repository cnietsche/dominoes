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
    <div className="safe-area-x scrollbar-thin flex min-h-[5.5rem] w-full items-center justify-start gap-2 overflow-x-auto border-t border-slate-700 bg-slate-900/80 px-3 py-3 sm:min-h-[6.25rem] sm:justify-center sm:gap-2 sm:px-6 sm:py-4">
      {pieces.map((piece, index) => {
        const isPlayable = isMyTurn && canPlayPiece(piece, table);
        const isSelected = selectedPiece === piece;

        let interactionClass = 'cursor-default opacity-70';
        if (isMyTurn) {
          interactionClass = isPlayable
            ? 'cursor-pointer active:scale-95'
            : 'cursor-not-allowed opacity-40';
        }

        const className = [
          'h-[4.5rem] w-[2.25rem] shrink-0 rounded sm:h-[5.5rem] sm:w-[2.75rem]',
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
              className="pointer-events-none h-full w-full object-contain"
            />
          </button>
        );
      })}
    </div>
  );
}
