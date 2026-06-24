package service

import (
	"github.com/dominoes/dominoes-api/internal/domain"
	"github.com/dominoes/dominoes-api/internal/entity"
)

type DoubleOpening struct {
	User  *entity.User
	Piece domain.PieceEnum
}
