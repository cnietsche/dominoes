package main

import (
	"log"
	"net/http"

	"github.com/dominoes/dominoes-api/internal/config"
	"github.com/dominoes/dominoes-api/internal/handler"
	"github.com/dominoes/dominoes-api/internal/presence"
	"github.com/dominoes/dominoes-api/internal/repository"
	"github.com/dominoes/dominoes-api/internal/service"
	"github.com/dominoes/dominoes-api/internal/websocket"
)

func main() {
	cfg := config.Load()

	lobbyRepository := repository.NewLobbyRepository()
	gameService := service.NewGameService(lobbyRepository)
	lobbyService := service.NewLobbyService(lobbyRepository, gameService, cfg.LobbySize)
	sessionRegistry := websocket.NewLobbySessionRegistry()
	presenceRefresh := presence.NewRefreshClient(cfg.PresenceRefreshURL, cfg.InternalAPISecret)
	wsHandler := websocket.NewLobbyWebSocketHandler(lobbyService, gameService, sessionRegistry, presenceRefresh)
	statsHandler := handler.NewStatsHandler(sessionRegistry, cfg.LobbySize, cfg.MinPlayers)

	http.HandleFunc("/ws/lobby", wsHandler.ServeWS)
	http.HandleFunc("/stats/online", statsHandler.ServeOnlineStats)

	addr := ":" + cfg.Port
	log.Printf("Lobby server listening on %s", addr)
	if err := http.ListenAndServe(addr, nil); err != nil {
		log.Fatal(err)
	}
}
