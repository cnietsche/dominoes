package entity

import (
	"time"

	"github.com/dominoes/lobby/internal/domain"
	"github.com/google/uuid"
)

type Lobby struct {
	ID              uuid.UUID
	Size            int
	InProgress      bool
	CurrentPlayerID *uuid.UUID
	DrawnThisTurn   bool
	Boneyard        []domain.PieceEnum
	Table           []TablePiece
}

func NewLobby(size int) *Lobby {
	return &Lobby{
		ID:         uuid.New(),
		Size:       size,
		Boneyard:   []domain.PieceEnum{},
		Table:      []TablePiece{},
	}
}

type User struct {
	ID        uuid.UUID
	Nickname  string
	JoinedAt  time.Time
	LobbyID   uuid.UUID
	Hand      []domain.PieceEnum
}

func NewUser(nickname string, lobby *Lobby) *User {
	return &User{
		ID:       uuid.New(),
		Nickname: nickname,
		JoinedAt: time.Now(),
		LobbyID:  lobby.ID,
		Hand:     []domain.PieceEnum{},
	}
}
