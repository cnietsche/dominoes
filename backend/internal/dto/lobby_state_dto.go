package dto

import "github.com/google/uuid"

type LobbyStateDto struct {
	LobbyID *uuid.UUID `json:"lobbyId"`
	Size    int        `json:"size"`
	Users   []UserDto  `json:"users"`
}

type UserDto struct {
	ID        string `json:"id"`
	Nickname  string `json:"nickname"`
	HandCount *int   `json:"handCount"`
}

type GameStateDto struct {
	InProgress      bool            `json:"inProgress"`
	BoneyardCount   int             `json:"boneyardCount"`
	Hand            []string        `json:"hand"`
	CurrentPlayerID *uuid.UUID      `json:"-"`
	Table           []TablePieceDto `json:"table"`
	DrawnThisTurn   bool            `json:"drawnThisTurn"`
}

type TablePieceDto struct {
	Code     string `json:"code"`
	Rotation string `json:"rotation"`
}
