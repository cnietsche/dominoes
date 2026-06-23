import type { TablePiece } from '../types/domino';
import type { TableSide } from '../types/lobby';

function parsePips(code: string): [number, number] {
  const [left, right] = code.split('-').map(Number);
  return [left, right];
}

function exposedLeftValue(tablePiece: TablePiece): number {
  const [left, right] = parsePips(tablePiece.code);
  switch (tablePiece.rotation) {
    case 'VERTICAL':
    case 'HORIZONTAL':
      return left;
    case 'HORIZONTAL_FLIPPED':
      return right;
  }
}

function exposedRightValue(tablePiece: TablePiece): number {
  const [left, right] = parsePips(tablePiece.code);
  switch (tablePiece.rotation) {
    case 'VERTICAL':
    case 'HORIZONTAL':
      return right;
    case 'HORIZONTAL_FLIPPED':
      return left;
  }
}

export function getExposedEnds(
  table: TablePiece[],
): { left: number; right: number } | null {
  if (table.length === 0) {
    return null;
  }
  return {
    left: exposedLeftValue(table[0]),
    right: exposedRightValue(table[table.length - 1]),
  };
}

export function pieceMatchesPip(pieceCode: string, pip: number): boolean {
  const [left, right] = parsePips(pieceCode);
  return left === pip || right === pip;
}

export function canPlayPieceOnSide(
  pieceCode: string,
  table: TablePiece[],
  side: TableSide,
): boolean {
  const ends = getExposedEnds(table);
  if (!ends) {
    return false;
  }
  const requiredPip = side === 'LEFT' ? ends.left : ends.right;
  return pieceMatchesPip(pieceCode, requiredPip);
}
