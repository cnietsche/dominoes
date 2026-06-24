import type { PieceRotation } from '../types/domino';

export const PIECE_WIDTH = 44;
export const PIECE_HEIGHT = 88;

function getFootprint(rotation: PieceRotation): { width: number; height: number } {
  if (rotation === 'VERTICAL') {
    return { width: PIECE_WIDTH, height: PIECE_HEIGHT };
  }
  return { width: PIECE_HEIGHT, height: PIECE_WIDTH };
}

interface DominoPieceProps {
  code: string;
  rotation: PieceRotation;
  scale?: number;
}

export function DominoPiece({ code, rotation, scale = 1 }: DominoPieceProps) {
  const footprint = getFootprint(rotation);
  const boxWidth = footprint.width * scale;
  const boxHeight = footprint.height * scale;
  const imgWidth = PIECE_WIDTH * scale;
  const imgHeight = PIECE_HEIGHT * scale;

  const rotateClass =
    rotation === 'VERTICAL'
      ? ''
      : rotation === 'HORIZONTAL'
        ? 'rotate-[-90deg]'
        : 'rotate-90';

  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-visible"
      style={{ width: boxWidth, height: boxHeight }}
    >
      <img
        src={`/dominoes/${code}.png`}
        alt={`Peça ${code}`}
        draggable={false}
        className={`shrink-0 ${rotateClass}`}
        style={{ width: imgWidth, height: imgHeight }}
      />
    </div>
  );
}

export function getScaleForCell(
  rotation: PieceRotation,
  cellSize: number,
): number {
  const footprint = getFootprint(rotation);
  return Math.min(cellSize / footprint.width, cellSize / footprint.height);
}
