package service

import (
	"github.com/dominoes/lobby/internal/domain"
	"github.com/dominoes/lobby/internal/entity"
)

type DoubleOpening struct {
	User  *entity.User
	Piece domain.PieceEnum
}
