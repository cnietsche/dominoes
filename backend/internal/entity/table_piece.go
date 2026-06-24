package entity

import (
	"github.com/dominoes/lobby/internal/domain"
)

type TablePiece struct {
	Piece    domain.PieceEnum
	Rotation domain.PieceRotation
}

func NewTablePiece(piece domain.PieceEnum, rotation domain.PieceRotation) TablePiece {
	return TablePiece{Piece: piece, Rotation: rotation}
}
