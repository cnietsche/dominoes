package websocket

import (
	"sync"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

type Session struct {
	ID   string
	Conn *websocket.Conn
	mu   sync.Mutex
}

type LobbySessionRegistry struct {
	sessionToUser map[string]uuid.UUID
	sessions      map[string]*Session
	mu            sync.RWMutex
}

func NewLobbySessionRegistry() *LobbySessionRegistry {
	return &LobbySessionRegistry{
		sessionToUser: make(map[string]uuid.UUID),
		sessions:      make(map[string]*Session),
	}
}

func (r *LobbySessionRegistry) RegisterSession(session *Session) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.sessions[session.ID] = session
}

func (r *LobbySessionRegistry) UnregisterSession(sessionID string) {
	r.mu.Lock()
	defer r.mu.Unlock()
	delete(r.sessions, sessionID)
	delete(r.sessionToUser, sessionID)
}

func (r *LobbySessionRegistry) BindUser(sessionID string, userID uuid.UUID) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.sessionToUser[sessionID] = userID
}

func (r *LobbySessionRegistry) UnbindUser(sessionID string) {
	r.mu.Lock()
	defer r.mu.Unlock()
	delete(r.sessionToUser, sessionID)
}

func (r *LobbySessionRegistry) FindUserID(sessionID string) (uuid.UUID, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	userID, ok := r.sessionToUser[sessionID]
	return userID, ok
}

func (r *LobbySessionRegistry) GetAllSessions() []*Session {
	r.mu.RLock()
	defer r.mu.RUnlock()
	result := make([]*Session, 0, len(r.sessions))
	for _, session := range r.sessions {
		result = append(result, session)
	}
	return result
}

func (s *Session) Lock() {
	s.mu.Lock()
}

func (s *Session) Unlock() {
	s.mu.Unlock()
}
