import { DominoPiece, getScaleForCell } from './DominoPiece';
import type { TablePiece } from '../types/domino';
import type { TableSide } from '../types/lobby';
import { canPlayPieceOnSide, isDoublePiece } from '../utils/dominoRules';

export const GRID_MAX_COLUMNS = 10;
export const GRID_ROWS = 3;
export const GRID_CELL_SIZE = 48;
export const GRID_GAP_PX = 4;
export const GRID_PIECE_SCALE = 0.72;

export const TABLE_GRID_HEIGHT =
  GRID_ROWS * GRID_CELL_SIZE + (GRID_ROWS - 1) * GRID_GAP_PX;

function chunkIntoRows<T>(items: T[]): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += GRID_MAX_COLUMNS) {
    rows.push(items.slice(i, i + GRID_MAX_COLUMNS));
  }
  return rows;
}

interface GameTableProps {
  table: TablePiece[];
  isMyTurn: boolean;
  selectedPiece: string | null;
  invalidFlash: { side: TableSide; nonce: number } | null;
  onPlayAtSide: (side: TableSide) => void;
}

function EndpointSlot({
  piece,
  side,
  label,
  canPlay,
  invalidFlash,
  onPlay,
  variant = 'piece',
}: {
  piece: TablePiece;
  side: TableSide;
  label: string;
  canPlay: boolean;
  invalidFlash: { side: TableSide; nonce: number } | null;
  onPlay: () => void;
  variant?: 'piece' | 'side-trigger';
}) {
  const isFlashing = invalidFlash?.side === side;

  return (
    <button
      type="button"
      aria-label={label}
      disabled={!canPlay}
      onClick={onPlay}
      key={isFlashing ? `flash-${invalidFlash.nonce}` : side}
      className={[
        'inline-flex shrink-0 items-center justify-center rounded-lg p-1 transition',
        variant === 'side-trigger' ? 'min-h-11 min-w-11' : '',
        canPlay
          ? 'cursor-pointer ring-2 ring-blue-400 hover:ring-blue-300'
          : 'cursor-default',
        isFlashing ? 'animate-flash-invalid-ring' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {variant === 'side-trigger' ? (
        <span className="text-lg text-slate-300">
          {side === 'LEFT' ? '◀' : '▶'}
        </span>
      ) : (
        <DominoPiece code={piece.code} rotation={piece.rotation} />
      )}
    </button>
  );
}

function SinglePieceEndpoints({
  piece,
  canPlayAtSide,
  invalidFlash,
  onPlayAtSide,
}: {
  piece: TablePiece;
  canPlayAtSide: (side: TableSide) => boolean;
  invalidFlash: { side: TableSide; nonce: number } | null;
  onPlayAtSide: (side: TableSide) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-3">
      <EndpointSlot
        piece={piece}
        side="LEFT"
        label="Jogar na extremidade esquerda"
        canPlay={canPlayAtSide('LEFT')}
        invalidFlash={invalidFlash}
        onPlay={() => onPlayAtSide('LEFT')}
        variant="side-trigger"
      />
      <div aria-hidden className="pointer-events-none">
        <DominoPiece code={piece.code} rotation={piece.rotation} />
      </div>
      <EndpointSlot
        piece={piece}
        side="RIGHT"
        label="Jogar na extremidade direita"
        canPlay={canPlayAtSide('RIGHT')}
        invalidFlash={invalidFlash}
        onPlay={() => onPlayAtSide('RIGHT')}
        variant="side-trigger"
      />
    </div>
  );
}

export function TableGrid({ pieces }: { pieces: TablePiece[] }) {
  const rows = chunkIntoRows(pieces);

  return (
    <div
      className="flex shrink-0 justify-center border-b border-slate-700/80 bg-slate-900/60 px-4 py-3"
      style={{ minHeight: TABLE_GRID_HEIGHT + 24 }}
    >
      {rows.length > 0 && (
        <div className="flex flex-col items-center gap-1">
          {rows.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className="flex justify-center gap-1"
              style={{ height: GRID_CELL_SIZE }}
            >
              {row.map((piece, colIndex) => {
                const scale =
                  getScaleForCell(piece.rotation, GRID_CELL_SIZE) *
                  GRID_PIECE_SCALE;

                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className="flex items-center justify-center overflow-visible rounded-md border border-slate-700/80 bg-slate-800/50"
                    style={{ width: GRID_CELL_SIZE, height: GRID_CELL_SIZE }}
                  >
                    <DominoPiece
                      code={piece.code}
                      rotation={piece.rotation}
                      scale={scale}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function GameTable({
  table,
  isMyTurn,
  selectedPiece,
  invalidFlash,
  onPlayAtSide,
}: GameTableProps) {
  if (table.length === 0) {
    return null;
  }

  const first = table[0];
  const last = table[table.length - 1];
  const isSingleNonDouble =
    table.length === 1 && !isDoublePiece(first.code);

  const canPlayAtSide = (side: TableSide) =>
    isMyTurn &&
    selectedPiece !== null &&
    canPlayPieceOnSide(selectedPiece, table, side);

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center">
      <div className="flex items-center justify-center gap-3 px-2 sm:gap-6">
        {isSingleNonDouble ? (
          <SinglePieceEndpoints
            piece={first}
            canPlayAtSide={canPlayAtSide}
            invalidFlash={invalidFlash}
            onPlayAtSide={onPlayAtSide}
          />
        ) : table.length > 1 ? (
          <>
            <EndpointSlot
              piece={first}
              side="LEFT"
              label="Jogar na extremidade esquerda"
              canPlay={canPlayAtSide('LEFT')}
              invalidFlash={invalidFlash}
              onPlay={() => onPlayAtSide('LEFT')}
            />
            <EndpointSlot
              piece={last}
              side="RIGHT"
              label="Jogar na extremidade direita"
              canPlay={canPlayAtSide('RIGHT')}
              invalidFlash={invalidFlash}
              onPlay={() => onPlayAtSide('RIGHT')}
            />
          </>
        ) : (
          <EndpointSlot
            piece={first}
            side="RIGHT"
            label="Jogar na mesa"
            canPlay={canPlayAtSide('RIGHT')}
            invalidFlash={invalidFlash}
            onPlay={() => onPlayAtSide('RIGHT')}
          />
        )}
      </div>
    </div>
  );
}
