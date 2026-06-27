package entity

import (
	"time"

	"github.com/google/uuid"
)

type Phase string

const (
	PhaseChoosing   Phase = "choosing"
	PhaseCountdown  Phase = "countdown"
	PhaseReveal     Phase = "reveal"
)

type Lobby struct {
	ID                uuid.UUID
	Size              int
	InProgress        bool
	Phase             Phase
	Choices           map[uuid.UUID]string
	CountdownEndsAt   *time.Time
	WinnerID          *uuid.UUID
	WinnerNickname    string
	DrawPending       bool
	ResultContinuedBy map[uuid.UUID]bool
	WinnerDismissedBy map[uuid.UUID]bool
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
