import { useEffect, useRef, useState } from 'react';
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

function rowNaturalWidth(pieceCount: number, cellSize: number, gap: number): number {
  if (pieceCount === 0) {
    return 0;
  }
  return pieceCount * cellSize + (pieceCount - 1) * gap;
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
        label="Play on the left end"
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
        label="Play on the right end"
        canPlay={canPlayAtSide('RIGHT')}
        invalidFlash={invalidFlash}
        onPlay={() => onPlayAtSide('RIGHT')}
        variant="side-trigger"
      />
    </div>
  );
}

export function TableGrid({ pieces }: { pieces: TablePiece[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [layoutScale, setLayoutScale] = useState(1);
  const rows = chunkIntoRows(pieces);
  const maxRowLength = rows.reduce((max, row) => Math.max(max, row.length), 0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || maxRowLength === 0) {
      setLayoutScale(1);
      return;
    }

    const updateScale = () => {
      const naturalWidth = rowNaturalWidth(
        maxRowLength,
        GRID_CELL_SIZE,
        GRID_GAP_PX,
      );
      const availableWidth = container.clientWidth;
      setLayoutScale(
        naturalWidth > availableWidth && availableWidth > 0
          ? availableWidth / naturalWidth
          : 1,
      );
    };

    updateScale();

    const resizeObserver = new ResizeObserver(updateScale);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [maxRowLength, pieces.length]);

  const cellSize = GRID_CELL_SIZE * layoutScale;
  const gap = GRID_GAP_PX * layoutScale;
  const gridHeight = rows.length * cellSize + Math.max(0, rows.length - 1) * gap;

  return (
    <div
      ref={containerRef}
      className="flex w-full max-w-full shrink-0 justify-center overflow-hidden border-b border-slate-700/80 bg-slate-900/60 px-2 py-3 sm:px-4"
      style={{ minHeight: gridHeight + 24 }}
    >
      {rows.length > 0 && (
        <div className="flex flex-col items-center" style={{ gap }}>
          {rows.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className="flex justify-center"
              style={{ gap, height: cellSize }}
            >
              {row.map((piece, colIndex) => {
                const scale =
                  getScaleForCell(piece.rotation, cellSize) * GRID_PIECE_SCALE;

                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className="flex items-center justify-center overflow-visible rounded-md border border-slate-700/80 bg-slate-800/50"
                    style={{ width: cellSize, height: cellSize }}
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
              label="Play on the left end"
              canPlay={canPlayAtSide('LEFT')}
              invalidFlash={invalidFlash}
              onPlay={() => onPlayAtSide('LEFT')}
            />
            <EndpointSlot
              piece={last}
              side="RIGHT"
              label="Play on the right end"
              canPlay={canPlayAtSide('RIGHT')}
              invalidFlash={invalidFlash}
              onPlay={() => onPlayAtSide('RIGHT')}
            />
          </>
        ) : (
          <EndpointSlot
            piece={first}
            side="RIGHT"
            label="Play on the table"
            canPlay={canPlayAtSide('RIGHT')}
            invalidFlash={invalidFlash}
            onPlay={() => onPlayAtSide('RIGHT')}
          />
        )}
      </div>
    </div>
  );
}
