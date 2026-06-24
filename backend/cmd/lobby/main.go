package main

import (
	"log"
	"net/http"

	"github.com/dominoes/lobby/internal/config"
	"github.com/dominoes/lobby/internal/repository"
	"github.com/dominoes/lobby/internal/service"
	"github.com/dominoes/lobby/internal/websocket"
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
