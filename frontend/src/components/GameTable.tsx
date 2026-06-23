import type { TableSide } from '../types/lobby';

interface GameTableProps {
  table: string[];
  isMyTurn: boolean;
  selectedPiece: string | null;
  onPlayLeft: () => void;
  onPlayRight: () => void;
}

export function GameTable({
  table,
  isMyTurn,
  selectedPiece,
  onPlayLeft,
  onPlayRight,
}: GameTableProps) {
  const canPlay = isMyTurn && selectedPiece !== null;

  return (
    <div className="flex w-full items-center justify-center gap-2 overflow-x-auto py-4">
      {canPlay ? (
        <button
          type="button"
          aria-label="Jogar à esquerda"
          onClick={onPlayLeft}
          className="h-[88px] w-[44px] shrink-0 rounded-lg bg-blue-600 transition hover:bg-blue-500"
        />
      ) : (
        <div className="h-[88px] w-[44px] shrink-0" />
      )}

      <div className="flex items-center gap-2">
        {table.map((piece, index) => (
          <img
            key={`${piece}-${index}`}
            src={`/dominoes/${piece}.png`}
            alt={`Peça ${piece}`}
            width={44}
            height={88}
            className="h-[88px] w-[44px] shrink-0"
          />
        ))}
      </div>

      {canPlay ? (
        <button
          type="button"
          aria-label="Jogar à direita"
          onClick={onPlayRight}
          className="h-[88px] w-[44px] shrink-0 rounded-lg bg-blue-600 transition hover:bg-blue-500"
        />
      ) : (
        <div className="h-[88px] w-[44px] shrink-0" />
      )}
    </div>
  );
}
