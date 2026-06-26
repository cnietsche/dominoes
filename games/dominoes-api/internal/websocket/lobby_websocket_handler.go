package websocket

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"github.com/dominoes/dominoes-api/internal/domain"
	"github.com/dominoes/dominoes-api/internal/presence"
	"github.com/dominoes/dominoes-api/internal/service"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

type LobbyWebSocketHandler struct {
	lobbyService     *service.LobbyService
	gameService      *service.GameService
	sessionRegistry  *LobbySessionRegistry
	presenceRefresh  *presence.RefreshClient
}

func NewLobbyWebSocketHandler(
	lobbyService *service.LobbyService,
	gameService *service.GameService,
	sessionRegistry *LobbySessionRegistry,
	presenceRefresh *presence.RefreshClient,
) *LobbyWebSocketHandler {
	return &LobbyWebSocketHandler{
		lobbyService:    lobbyService,
		gameService:     gameService,
		sessionRegistry: sessionRegistry,
		presenceRefresh: presenceRefresh,
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
		hadLobbyUser := false
		if userID, ok := h.sessionRegistry.FindUserID(session.ID); ok {
			hadLobbyUser = true
			h.lobbyService.LeaveLobby(userID)
			h.broadcastLobbyState()
			h.broadcastGameState()
			log.Printf("User %s removed on disconnect (session %s)", userID, session.ID)
		}
		h.sessionRegistry.UnregisterSession(session.ID)
		conn.Close()
		log.Printf("WebSocket disconnected: %s", session.ID)
		if hadLobbyUser {
			h.notifyPresenceRefresh()
		}
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
		h.sendToSession(session, ErrorMessage("Unknown message type."))
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
	case "DISMISS_WINNER":
		h.handleDismissWinner(session)
	default:
		h.sendToSession(session, ErrorMessage("Unknown message type."))
	}
}

func (h *LobbyWebSocketHandler) handleJoin(session *Session, nickname string) {
	if strings.TrimSpace(nickname) == "" {
		h.sendToSession(session, ErrorMessage("Nickname is required."))
		return
	}
	if _, ok := h.sessionRegistry.FindUserID(session.ID); ok {
		h.sendToSession(session, ErrorMessage("You are already in the lobby."))
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
	h.notifyPresenceRefresh()
	log.Printf("User %s joined lobby", user.ID)
}

func (h *LobbyWebSocketHandler) handleLeave(session *Session) {
	leftLobby := false
	if userID, ok := h.sessionRegistry.FindUserID(session.ID); ok {
		h.lobbyService.LeaveLobby(userID)
		h.sessionRegistry.UnbindUser(session.ID)
		leftLobby = true
		log.Printf("User %s left lobby", userID)
	}
	h.broadcastLobbyState()
	h.broadcastGameState()
	h.sendToSession(session, LobbyState(h.lobbyService.GetLobbyState()))
	h.sendToSession(session, GameState(h.gameService.GetGameStateForUser(nil)))
	if leftLobby {
		h.notifyPresenceRefresh()
	}
}

func (h *LobbyWebSocketHandler) handleStartGame(session *Session) {
	if _, ok := h.sessionRegistry.FindUserID(session.ID); !ok {
		h.sendToSession(session, ErrorMessage("You must be in the lobby to start the game."))
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
		h.sendToSession(session, ErrorMessage("You must be in the lobby to end the game."))
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
		h.sendToSession(session, ErrorMessage("You must be in the lobby to play."))
		return
	}
	if strings.TrimSpace(pieceCode) == "" {
		h.sendToSession(session, ErrorMessage("Piece is required."))
		return
	}
	if strings.TrimSpace(sideCode) == "" {
		h.sendToSession(session, ErrorMessage("Table side is required."))
		return
	}

	piece, err := domain.PieceEnumFromCode(pieceCode)
	if err != nil {
		h.sendToSession(session, ErrorMessage("Invalid piece."))
		return
	}

	side, err := domain.TableSideFromString(sideCode)
	if err != nil {
		h.sendToSession(session, ErrorMessage("Invalid table side."))
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
		h.sendToSession(session, ErrorMessage("You must be in the lobby to draw from the boneyard."))
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

func (h *LobbyWebSocketHandler) handleDismissWinner(session *Session) {
	userID, ok := h.sessionRegistry.FindUserID(session.ID)
	if !ok {
		return
	}
	h.gameService.DismissWinner(userID)
	h.broadcastGameState()
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

func (h *LobbyWebSocketHandler) notifyPresenceRefresh() {
	if h.presenceRefresh != nil {
		h.presenceRefresh.NotifyLobbyChanged()
	}
}
