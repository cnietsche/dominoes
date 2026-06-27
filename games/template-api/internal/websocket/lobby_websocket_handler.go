package websocket

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"github.com/dominoes/template-api/internal/presence"
	"github.com/dominoes/template-api/internal/service"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

type LobbyWebSocketHandler struct {
	lobbyService    *service.LobbyService
	sessionRegistry *LobbySessionRegistry
	presenceRefresh *presence.RefreshClient
}

func NewLobbyWebSocketHandler(
	lobbyService *service.LobbyService,
	sessionRegistry *LobbySessionRegistry,
	presenceRefresh *presence.RefreshClient,
) *LobbyWebSocketHandler {
	return &LobbyWebSocketHandler{
		lobbyService:    lobbyService,
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
	h.sendToSession(session, LobbyState(h.lobbyService.GetLobbyState()))
	if leftLobby {
		h.notifyPresenceRefresh()
	}
}

func (h *LobbyWebSocketHandler) broadcastLobbyState() {
	state := h.lobbyService.GetLobbyState()
	message := LobbyState(state)
	for _, target := range h.sessionRegistry.GetAllSessions() {
		h.sendToSession(target, message)
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
