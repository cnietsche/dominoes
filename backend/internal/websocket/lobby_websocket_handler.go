package websocket

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"github.com/dominoes/lobby/internal/domain"
	"github.com/dominoes/lobby/internal/service"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

type LobbyWebSocketHandler struct {
	lobbyService    *service.LobbyService
	gameService     *service.GameService
	sessionRegistry *LobbySessionRegistry
}

func NewLobbyWebSocketHandler(
	lobbyService *service.LobbyService,
	gameService *service.GameService,
	sessionRegistry *LobbySessionRegistry,
) *LobbyWebSocketHandler {
	return &LobbyWebSocketHandler{
		lobbyService:    lobbyService,
		gameService:     gameService,
		sessionRegistry: sessionRegistry,
	}
}

func (h *LobbyWebSocketHandler) ServeWS(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade failed: %v", err)
		return
	}

	session := &Session{ID: uuid.New().String(), Conn: conn}
	h.sessionRegistry.RegisterSession(session)
	log.Printf("WebSocket connected: %s", session.ID)

	defer func() {
		if userID, ok := h.sessionRegistry.FindUserID(session.ID); ok {
			h.lobbyService.LeaveLobby(userID)
			h.broadcastLobbyState()
			h.broadcastGameState()
			log.Printf("User %s removed on disconnect (session %s)", userID, session.ID)
		}
		h.sessionRegistry.UnregisterSession(session.ID)
		conn.Close()
		log.Printf("WebSocket disconnected: %s", session.ID)
	}()

	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			break
		}

		session.Lock()
		h.handleTextMessage(session, message)
		session.Unlock()
	}
}

func (h *LobbyWebSocketHandler) handleTextMessage(session *Session, message []byte) {
	incoming, err := ParseIncomingMessage(message)
	if err != nil {
		h.sendToSession(session, ErrorMessage("Tipo de mensagem desconhecido."))
		return
	}

	switch incoming.Type {
	case "JOIN":
		h.handleJoin(session, incoming.Nickname)
	case "LEAVE":
		h.handleLeave(session)
	case "START_GAME":
		h.handleStartGame(session)
	case "END_GAME":
		h.handleEndGame(session)
	case "PLAY_PIECE":
		h.handlePlayPiece(session, incoming.Piece, incoming.Side)
	case "DRAW_FROM_BONEYARD":
		h.handleDrawFromBoneyard(session)
	default:
		h.sendToSession(session, ErrorMessage("Tipo de mensagem desconhecido."))
	}
}

func (h *LobbyWebSocketHandler) handleJoin(session *Session, nickname string) {
	if strings.TrimSpace(nickname) == "" {
		h.sendToSession(session, ErrorMessage("Nickname é obrigatório."))
		return
	}
	if _, ok := h.sessionRegistry.FindUserID(session.ID); ok {
		h.sendToSession(session, ErrorMessage("Você já está no lobby."))
		return
	}

	user, err := h.lobbyService.JoinLobby(nickname)
	if err != nil {
		h.sendToSession(session, ErrorMessage(err.Error()))
		return
	}

	h.sessionRegistry.BindUser(session.ID, user.ID)
	h.sendToSession(session, JoinAck(user.ID))
	h.broadcastLobbyState()
	log.Printf("User %s joined lobby", user.ID)
}

func (h *LobbyWebSocketHandler) handleLeave(session *Session) {
	if userID, ok := h.sessionRegistry.FindUserID(session.ID); ok {
		h.lobbyService.LeaveLobby(userID)
		h.sessionRegistry.UnbindUser(session.ID)
		log.Printf("User %s left lobby", userID)
	}
	h.broadcastLobbyState()
	h.broadcastGameState()
	h.sendToSession(session, LobbyState(h.lobbyService.GetLobbyState()))
	h.sendToSession(session, GameState(h.gameService.GetGameStateForUser(nil)))
}

func (h *LobbyWebSocketHandler) handleStartGame(session *Session) {
	if _, ok := h.sessionRegistry.FindUserID(session.ID); !ok {
		h.sendToSession(session, ErrorMessage("Você precisa estar no lobby para iniciar a partida."))
		return
	}

	_, err := h.gameService.StartGame()
	if err != nil {
		h.sendToSession(session, ErrorMessage(err.Error()))
		return
	}

	h.sendToSession(session, StartGameAck())
	h.broadcastLobbyState()
	h.broadcastGameState()
	log.Printf("Game started by session %s", session.ID)
}

func (h *LobbyWebSocketHandler) handleEndGame(session *Session) {
	if _, ok := h.sessionRegistry.FindUserID(session.ID); !ok {
		h.sendToSession(session, ErrorMessage("Você precisa estar no lobby para finalizar a partida."))
		return
	}

	_, err := h.gameService.FinishGame()
	if err != nil {
		h.sendToSession(session, ErrorMessage(err.Error()))
		return
	}

	h.sendToSession(session, EndGameAck())
	h.broadcastLobbyState()
	h.broadcastGameState()
	log.Printf("Game ended by session %s", session.ID)
}

func (h *LobbyWebSocketHandler) handlePlayPiece(session *Session, pieceCode, sideCode string) {
	userID, ok := h.sessionRegistry.FindUserID(session.ID)
	if !ok {
		h.sendToSession(session, ErrorMessage("Você precisa estar no lobby para jogar."))
		return
	}
	if strings.TrimSpace(pieceCode) == "" {
		h.sendToSession(session, ErrorMessage("Peça é obrigatória."))
		return
	}
	if strings.TrimSpace(sideCode) == "" {
		h.sendToSession(session, ErrorMessage("Lado da mesa é obrigatório."))
		return
	}

	piece, err := domain.PieceEnumFromCode(pieceCode)
	if err != nil {
		h.sendToSession(session, ErrorMessage("Lado da mesa inválido."))
		return
	}

	side, err := domain.TableSideFromString(sideCode)
	if err != nil {
		h.sendToSession(session, ErrorMessage("Lado da mesa inválido."))
		return
	}

	_, err = h.gameService.PlayPiece(userID, piece, side)
	if err != nil {
		h.sendToSession(session, ErrorMessage(err.Error()))
		return
	}

	h.sendToSession(session, PlayPieceAck())
	h.broadcastLobbyState()
	h.broadcastGameState()
	log.Printf("User %s played piece %s on %s", userID, pieceCode, sideCode)
}

func (h *LobbyWebSocketHandler) handleDrawFromBoneyard(session *Session) {
	userID, ok := h.sessionRegistry.FindUserID(session.ID)
	if !ok {
		h.sendToSession(session, ErrorMessage("Você precisa estar no lobby para comprar do monte."))
		return
	}

	_, err := h.gameService.DrawFromBoneyard(userID)
	if err != nil {
		h.sendToSession(session, ErrorMessage(err.Error()))
		return
	}

	h.sendToSession(session, DrawFromBoneyardAck())
	h.broadcastLobbyState()
	h.broadcastGameState()
	log.Printf("User %s drew from boneyard", userID)
}

func (h *LobbyWebSocketHandler) broadcastLobbyState() {
	state := h.lobbyService.GetLobbyState()
	message := LobbyState(state)
	for _, target := range h.sessionRegistry.GetAllSessions() {
		h.sendToSession(target, message)
	}
}

func (h *LobbyWebSocketHandler) broadcastGameState() {
	for _, target := range h.sessionRegistry.GetAllSessions() {
		var userID *uuid.UUID
		if id, ok := h.sessionRegistry.FindUserID(target.ID); ok {
			userID = &id
		}
		h.sendToSession(target, GameState(h.gameService.GetGameStateForUser(userID)))
	}
}

func (h *LobbyWebSocketHandler) sendToSession(session *Session, message OutgoingMessage) {
	data, err := json.Marshal(message)
	if err != nil {
		log.Printf("Failed to marshal message: %v", err)
		return
	}
	if err := session.Conn.WriteMessage(websocket.TextMessage, data); err != nil {
		log.Printf("Failed to send message to session %s: %v", session.ID, err)
	}
}
