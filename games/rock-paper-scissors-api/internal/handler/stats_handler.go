package handler

import (
	"encoding/json"
	"net/http"

	"github.com/dominoes/rock-paper-scissors-api/internal/websocket"
)

type StatsHandler struct {
	sessionRegistry *websocket.LobbySessionRegistry
	lobbySize       int
	minPlayers      int
}

func NewStatsHandler(
	sessionRegistry *websocket.LobbySessionRegistry,
	lobbySize int,
	minPlayers int,
) *StatsHandler {
	return &StatsHandler{
		sessionRegistry: sessionRegistry,
		lobbySize:       lobbySize,
		minPlayers:      minPlayers,
	}
}

type onlineStatsResponse struct {
	GameID     string `json:"gameId"`
	Count      int    `json:"count"`
	LobbySize  int    `json:"lobbySize"`
	MinPlayers int    `json:"minPlayers"`
}

func (h *StatsHandler) ServeOnlineStats(w http.ResponseWriter, _ *http.Request) {
	response := onlineStatsResponse{
		GameID:     "ROCK_PAPER_SCISSORS",
		Count:      h.sessionRegistry.CountOnlinePlayers(),
		LobbySize:  h.lobbySize,
		MinPlayers: h.minPlayers,
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(response); err != nil {
		http.Error(w, "failed to encode response", http.StatusInternalServerError)
	}
}
