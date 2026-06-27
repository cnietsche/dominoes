package entity

import (
	"time"

	"github.com/google/uuid"
)

type Lobby struct {
	ID         uuid.UUID
	Size       int
	InProgress bool
}

func NewLobby(size int) *Lobby {
	return &Lobby{
		ID:   uuid.New(),
		Size: size,
	}
}

type User struct {
	ID       uuid.UUID
	Nickname string
	JoinedAt time.Time
	LobbyID  uuid.UUID
}

func NewUser(nickname string, lobby *Lobby) *User {
	return &User{
		ID:       uuid.New(),
		Nickname: nickname,
		JoinedAt: time.Now(),
		LobbyID:  lobby.ID,
	}
}
