package dto

import "github.com/google/uuid"

type LobbyStateDto struct {
	LobbyID *uuid.UUID `json:"lobbyId"`
	Size    int        `json:"size"`
	Users   []UserDto  `json:"users"`
}

type UserDto struct {
	ID       string `json:"id"`
	Nickname string `json:"nickname"`
}
