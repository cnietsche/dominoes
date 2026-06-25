import { useEffect, useRef, useState } from 'react';
import type { TablePiece } from '../types/domino';
import { canPlayPiece } from '../utils/dominoRules';

interface PlayerHandProps {
  pieces: string[];
  table: TablePiece[];
  isMyTurn: boolean;
  selectedPiece: string | null;
  onSelectPiece: (piece: string) => void;
}

const GAP_PX = 8;

function getBasePieceSize(): { width: number; height: number } {
  const isSm = window.matchMedia('(min-width: 640px)').matches;
  return isSm ? { width: 44, height: 88 } : { width: 36, height: 72 };
}

function computeScale(pieceCount: number, containerWidth: number): number {
  if (pieceCount === 0 || containerWidth <= 0) {
    return 1;
  }

  const { width } = getBasePieceSize();
  const naturalWidth = pieceCount * width + (pieceCount - 1) * GAP_PX;

  if (naturalWidth <= containerWidth) {
    return 1;
  }

  return containerWidth / naturalWidth;
}

export function PlayerHand({
  pieces,
  table,
  isMyTurn,
  selectedPiece,
  onSelectPiece,
}: PlayerHandProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const updateScale = () => {
      setScale(computeScale(pieces.length, container.clientWidth));
    };

    updateScale();

    const resizeObserver = new ResizeObserver(updateScale);
    resizeObserver.observe(container);

    const mediaQuery = window.matchMedia('(min-width: 640px)');
    mediaQuery.addEventListener('change', updateScale);

    return () => {
      resizeObserver.disconnect();
      mediaQuery.removeEventListener('change', updateScale);
    };
  }, [pieces.length]);

  const { width: baseWidth, height: baseHeight } = getBasePieceSize();
  const pieceWidth = baseWidth * scale;
  const pieceHeight = baseHeight * scale;
  const gap = GAP_PX * scale;

  return (
    <div
      ref={containerRef}
      className="safe-area-x flex w-full items-center justify-center overflow-hidden border-t border-slate-700 bg-slate-900/80 px-3 py-3 sm:px-6 sm:py-4"
      style={{ minHeight: pieceHeight + 24 }}
    >
      <div
        className="flex items-center justify-center"
        style={{ gap }}
      >
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
            'shrink-0 rounded',
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
              style={{ width: pieceWidth, height: pieceHeight }}
              aria-label={`Piece ${piece}${isPlayable ? '' : ' (not playable)'}`}
              aria-pressed={isSelected}
              aria-disabled={!isPlayable}
            >
              <img
                src={`/dominoes/${piece}.png`}
                alt=""
                className="pointer-events-none h-full w-full object-contain"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
