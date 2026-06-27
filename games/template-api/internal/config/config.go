package config

import (
	"os"
	"strconv"
)

type Config struct {
	Port               string
	LobbySize          int
	MinPlayers         int
	PresenceRefreshURL string
	InternalAPISecret  string
}

func Load() Config {
	lobbySize := 2
	if v := os.Getenv("LOBBY_SIZE"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			lobbySize = n
		}
	}

	minPlayers := 2
	if v := os.Getenv("LOBBY_MIN_PLAYERS"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			minPlayers = n
		}
	}

	return Config{
		Port:               "8000",
		LobbySize:          lobbySize,
		MinPlayers:         minPlayers,
		PresenceRefreshURL: os.Getenv("PRESENCE_REFRESH_URL"),
		InternalAPISecret:  os.Getenv("INTERNAL_API_SECRET"),
	}
}
