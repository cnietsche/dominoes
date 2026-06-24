package repository

import (
	"sort"
	"sync"

	"github.com/dominoes/dominoes-api/internal/entity"
	"github.com/google/uuid"
)

type LobbyRepository struct {
	mu    sync.Mutex
	lobby *entity.Lobby
	users map[uuid.UUID]*entity.User
}

func NewLobbyRepository() *LobbyRepository {
	return &LobbyRepository{
		users: make(map[uuid.UUID]*entity.User),
	}
}

func (r *LobbyRepository) Lock() {
	r.mu.Lock()
}

func (r *LobbyRepository) Unlock() {
	r.mu.Unlock()
}

func (r *LobbyRepository) FindFirstByOrderByIDAsc() (*entity.Lobby, bool) {
	if r.lobby == nil {
		return nil, false
	}
	return r.lobby, true
}

func (r *LobbyRepository) SaveLobby(lobby *entity.Lobby) *entity.Lobby {
	r.lobby = lobby
	return lobby
}

func (r *LobbyRepository) SaveUser(user *entity.User) *entity.User {
	r.users[user.ID] = user
	return user
}

func (r *LobbyRepository) FindUserByID(id uuid.UUID) (*entity.User, bool) {
	user, ok := r.users[id]
	return user, ok
}

func (r *LobbyRepository) DeleteUserByID(id uuid.UUID) {
	delete(r.users, id)
}

func (r *LobbyRepository) CountByLobby(lobby *entity.Lobby) int {
	count := 0
	for _, user := range r.users {
		if user.LobbyID == lobby.ID {
			count++
		}
	}
	return count
}

func (r *LobbyRepository) FindByLobbyOrderByJoinedAtAsc(lobby *entity.Lobby) []*entity.User {
	var users []*entity.User
	for _, user := range r.users {
		if user.LobbyID == lobby.ID {
			users = append(users, user)
		}
	}
	sort.Slice(users, func(i, j int) bool {
		return users[i].JoinedAt.Before(users[j].JoinedAt)
	})
	return users
}
