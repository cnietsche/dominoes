import type { PieceRotation } from '../types/domino';

const PIECE_WIDTH = 44;
const PIECE_HEIGHT = 88;

interface DominoPieceProps {
  code: string;
  rotation: PieceRotation;
}

export function DominoPiece({ code, rotation }: DominoPieceProps) {
  if (rotation === 'VERTICAL') {
    return (
      <div
        className="flex shrink-0 items-center justify-center"
        style={{ width: PIECE_WIDTH, height: PIECE_HEIGHT }}
      >
        <img
          src={`/dominoes/${code}.png`}
          alt={`Peça ${code}`}
          width={PIECE_WIDTH}
          height={PIECE_HEIGHT}
          className="h-[88px] w-[44px]"
        />
      </div>
    );
  }

  const rotateClass =
    rotation === 'HORIZONTAL' ? 'rotate-[-90deg]' : 'rotate-90';

  return (
    <div
      className="flex shrink-0 items-center justify-center"
      style={{ width: PIECE_HEIGHT, height: PIECE_WIDTH }}
    >
      <img
        src={`/dominoes/${code}.png`}
        alt={`Peça ${code}`}
        width={PIECE_WIDTH}
        height={PIECE_HEIGHT}
        className={`h-[88px] w-[44px] ${rotateClass}`}
      />
    </div>
  );
}
