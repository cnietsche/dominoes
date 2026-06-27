package dto

import (
	"time"

	"github.com/google/uuid"
)

type GameStateDto struct {
	InProgress      bool
	Phase           string
	MyChoice        *string
	OpponentChoice  *string
	CountdownEndsAt *time.Time
	WinnerID        *uuid.UUID
	WinnerNickname  string
	DrawPending        bool
	ContinuedToResult  bool
	CanStart           bool
	ShowResultModal    bool
}
