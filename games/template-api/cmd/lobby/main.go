package main

import (
	"log"
	"net/http"

	"github.com/dominoes/template-api/internal/config"
	"github.com/dominoes/template-api/internal/handler"
	"github.com/dominoes/template-api/internal/presence"
	"github.com/dominoes/template-api/internal/repository"
	"github.com/dominoes/template-api/internal/service"
	"github.com/dominoes/template-api/internal/websocket"
)

func main() {
	cfg := config.Load()

	lobbyRepository := repository.NewLobbyRepository()
	lobbyService := service.NewLobbyService(lobbyRepository, cfg.LobbySize)
	sessionRegistry := websocket.NewLobbySessionRegistry()
	presenceRefresh := presence.NewRefreshClient(cfg.PresenceRefreshURL, cfg.InternalAPISecret)
	wsHandler := websocket.NewLobbyWebSocketHandler(lobbyService, sessionRegistry, presenceRefresh)
	statsHandler := handler.NewStatsHandler(sessionRegistry, cfg.LobbySize, cfg.MinPlayers)

	http.HandleFunc("/ws/lobby", wsHandler.ServeWS)
	http.HandleFunc("/stats/online", statsHandler.ServeOnlineStats)

	addr := ":" + cfg.Port
	log.Printf("Template game API listening on %s", addr)
	if err := http.ListenAndServe(addr, nil); err != nil {
		log.Fatal(err)
	}
}
