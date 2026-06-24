package main

import (
	"log"
	"net/http"

	"github.com/dominoes/dominoes-api/internal/config"
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
	handler := websocket.NewLobbyWebSocketHandler(lobbyService, gameService, sessionRegistry)

	http.HandleFunc("/ws/lobby", handler.ServeWS)

	addr := ":" + cfg.Port
	log.Printf("Lobby server listening on %s", addr)
	if err := http.ListenAndServe(addr, nil); err != nil {
		log.Fatal(err)
	}
}
