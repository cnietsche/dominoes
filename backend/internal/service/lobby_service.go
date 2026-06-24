package service

import (
	"github.com/dominoes/lobby/internal/dto"
	"github.com/dominoes/lobby/internal/entity"
	"github.com/dominoes/lobby/internal/exception"
	"github.com/dominoes/lobby/internal/repository"
	"github.com/google/uuid"
)

type LobbyService struct {
	lobbyRepository *repository.LobbyRepository
	gameService     *GameService
	lobbySize       int
}

func NewLobbyService(lobbyRepository *repository.LobbyRepository, gameService *GameService, lobbySize int) *LobbyService {
	return &LobbyService{
		lobbyRepository: lobbyRepository,
		gameService:     gameService,
		lobbySize:       lobbySize,
	}
}

func (s *LobbyService) JoinLobby(nickname string) (*entity.User, error) {
	s.lobbyRepository.Lock()
	defer s.lobbyRepository.Unlock()

	lobby := s.getOrCreateLobby()
	if lobby.InProgress {
		return nil, &exception.GameInProgressError{}
	}
	if s.lobbyRepository.CountByLobby(lobby) >= lobby.Size {
		return nil, &exception.LobbyFullError{}
	}

	user := entity.NewUser(nickname, lobby)
	return s.lobbyRepository.SaveUser(user), nil
}

func (s *LobbyService) LeaveLobby(userID uuid.UUID) {
	s.lobbyRepository.Lock()
	defer s.lobbyRepository.Unlock()

	user, ok := s.lobbyRepository.FindUserByID(userID)
	if !ok {
		return
	}
	lobby, ok := s.lobbyRepository.FindFirstByOrderByIDAsc()
	if !ok {
		return
	}
	if lobby.InProgress {
		s.gameService.endGameLocked(lobby, nil)
	}
	s.gameService.OnUserLeftLobby(lobby, userID)
	s.lobbyRepository.DeleteUserByID(userID)
	_ = user
}

func (s *LobbyService) GetLobbyState() dto.LobbyStateDto {
	s.lobbyRepository.Lock()
	defer s.lobbyRepository.Unlock()

	lobby, ok := s.lobbyRepository.FindFirstByOrderByIDAsc()
	if !ok {
		return dto.LobbyStateDto{LobbyID: nil, Size: s.lobbySize, Users: []dto.UserDto{}}
	}
	return s.toLobbyState(lobby)
}

func (s *LobbyService) getOrCreateLobby() *entity.Lobby {
	lobby, ok := s.lobbyRepository.FindFirstByOrderByIDAsc()
	if ok {
		return lobby
	}
	return s.lobbyRepository.SaveLobby(entity.NewLobby(s.lobbySize))
}

func (s *LobbyService) toLobbyState(lobby *entity.Lobby) dto.LobbyStateDto {
	users := s.lobbyRepository.FindByLobbyOrderByJoinedAtAsc(lobby)
	userDtos := make([]dto.UserDto, 0, len(users))
	for _, user := range users {
		var handCount *int
		if lobby.InProgress {
			count := len(user.Hand)
			handCount = &count
		}
		userDtos = append(userDtos, dto.UserDto{
			ID:        user.ID.String(),
			Nickname:  user.Nickname,
			HandCount: handCount,
		})
	}
	lobbyID := lobby.ID
	return dto.LobbyStateDto{
		LobbyID: &lobbyID,
		Size:    lobby.Size,
		Users:   userDtos,
	}
}
