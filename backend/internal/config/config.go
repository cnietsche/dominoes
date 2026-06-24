package config

import (
	"os"
	"strconv"
)

type Config struct {
	Port      string
	LobbySize int
}

func Load() Config {
	lobbySize := 4
	if v := os.Getenv("LOBBY_SIZE"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			lobbySize = n
		}
	}
	return Config{
		Port:      "8081",
		LobbySize: lobbySize,
	}
}
