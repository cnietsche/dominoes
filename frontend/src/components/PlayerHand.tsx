interface PlayerHandProps {
  pieces: string[];
  isMyTurn: boolean;
  selectedPiece: string | null;
  onSelectPiece: (piece: string) => void;
}

export function PlayerHand({
  pieces,
  isMyTurn,
  selectedPiece,
  onSelectPiece,
}: PlayerHandProps) {
  return (
    <div className="flex min-h-[100px] w-full items-center justify-center gap-2 overflow-x-auto border-t border-slate-700 bg-slate-900/80 px-6 py-4">
      {pieces.map((piece) => {
        const isSelected = selectedPiece === piece;
        const className = [
          'h-[88px] w-[44px] shrink-0 rounded',
          isMyTurn ? 'cursor-pointer' : 'cursor-default opacity-70',
          isSelected ? 'ring-2 ring-blue-400' : '',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <button
            key={piece}
            type="button"
            disabled={!isMyTurn}
            onClick={() => onSelectPiece(piece)}
            className={className}
            aria-label={`Peça ${piece}`}
            aria-pressed={isSelected}
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
