package domain

type PieceRotation string

const (
	PieceRotationVertical          PieceRotation = "VERTICAL"
	PieceRotationHorizontal        PieceRotation = "HORIZONTAL"
	PieceRotationHorizontalFlipped PieceRotation = "HORIZONTAL_FLIPPED"
)
