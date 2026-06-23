export type PieceRotation = 'VERTICAL' | 'HORIZONTAL' | 'HORIZONTAL_FLIPPED';

export interface TablePiece {
  code: string;
  rotation: PieceRotation;
}
