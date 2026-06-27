package service

import (
	"fmt"
	"time"

	"github.com/dominoes/rock-paper-scissors-api/internal/domain"
	"github.com/dominoes/rock-paper-scissors-api/internal/dto"
	"github.com/dominoes/rock-paper-scissors-api/internal/entity"
	"github.com/dominoes/rock-paper-scissors-api/internal/exception"
	"github.com/dominoes/rock-paper-scissors-api/internal/repository"
	"github.com/google/uuid"
)

const (
	countdownDuration = 3 * time.Second
	minPlayers        = 2
)

type GameService struct {
	lobbyRepository *repository.LobbyRepository
	onStateChange   func()
}

func NewGameService(lobbyRepository *repository.LobbyRepository) *GameService {
	return &GameService{lobbyRepository: lobbyRepository}
}

func (s *GameService) SetStateChangeCallback(callback func()) {
	s.onStateChange = callback
}

func (s *GameService) StartGame() (dto.GameStateDto, error) {
	s.lobbyRepository.Lock()
	defer s.lobbyRepository.Unlock()

	lobby, err := s.getLobbyLocked()
	if err != nil {
		return dto.GameStateDto{}, err
	}
	if lobby.InProgress {
		return dto.GameStateDto{}, &exception.GameAlreadyInProgressError{}
	}
	if lobby.WinnerID != nil || lobby.DrawPending {
		return dto.GameStateDto{}, &exception.WinnerPendingError{}
	}

	users := s.lobbyRepository.FindByLobbyOrderByJoinedAtAsc(lobby)
	if len(users) < minPlayers {
		return dto.GameStateDto{}, fmt.Errorf("At least %d players are required to start.", minPlayers)
	}

	s.resetRoundState(lobby)
	s.clearResultState(lobby)
	lobby.InProgress = true
	lobby.Phase = entity.PhaseChoosing
	s.lobbyRepository.SaveLobby(lobby)
	return s.toGameState(lobby, nil), nil
}

func (s *GameService) SubmitChoice(userID uuid.UUID, choiceRaw string) (dto.GameStateDto, error) {
	choice, err := domain.ParseChoice(choiceRaw)
	if err != nil {
		return dto.GameStateDto{}, err
	}

	s.lobbyRepository.Lock()
	defer s.lobbyRepository.Unlock()

	lobby, err := s.getLobbyLocked()
	if err != nil {
		return dto.GameStateDto{}, err
	}
	if !lobby.InProgress {
		return dto.GameStateDto{}, &exception.GameNotInProgressError{}
	}
	if lobby.Phase != entity.PhaseChoosing && lobby.Phase != entity.PhaseCountdown {
		return dto.GameStateDto{}, fmt.Errorf("Choices cannot be submitted in the current phase.")
	}

	if _, ok := s.lobbyRepository.FindUserByID(userID); !ok {
		return dto.GameStateDto{}, fmt.Errorf("Player not found.")
	}

	if lobby.Choices == nil {
		lobby.Choices = make(map[uuid.UUID]string)
	}
	lobby.Choices[userID] = choice.String()

	if lobby.Phase == entity.PhaseChoosing && s.allPlayersHaveChoices(lobby) {
		s.startCountdownLocked(lobby)
	}

	s.lobbyRepository.SaveLobby(lobby)
	return s.toGameState(lobby, &userID), nil
}

func (s *GameService) ContinueToResult(userID uuid.UUID) (dto.GameStateDto, error) {
	s.lobbyRepository.Lock()
	defer s.lobbyRepository.Unlock()

	lobby, err := s.getLobbyLocked()
	if err != nil {
		return dto.GameStateDto{}, err
	}
	if lobby.Phase != entity.PhaseReveal {
		return dto.GameStateDto{}, fmt.Errorf("The result is not ready to continue.")
	}
	if _, ok := s.lobbyRepository.FindUserByID(userID); !ok {
		return dto.GameStateDto{}, fmt.Errorf("Player not found.")
	}
	if lobby.ResultContinuedBy == nil {
		lobby.ResultContinuedBy = make(map[uuid.UUID]bool)
	}
	lobby.ResultContinuedBy[userID] = true

	if s.allPlayersContinuedToResult(lobby) {
		lobby.Phase = ""
		lobby.Choices = nil
		lobby.CountdownEndsAt = nil
		lobby.InProgress = false
	}

	s.lobbyRepository.SaveLobby(lobby)
	return s.toGameState(lobby, &userID), nil
}

func (s *GameService) DismissWinner(userID uuid.UUID) {
	s.lobbyRepository.Lock()
	defer s.lobbyRepository.Unlock()

	lobby, ok := s.lobbyRepository.FindFirstByOrderByIDAsc()
	if !ok || (lobby.WinnerID == nil && !lobby.DrawPending) {
		return
	}
	if lobby.WinnerDismissedBy == nil {
		lobby.WinnerDismissedBy = make(map[uuid.UUID]bool)
	}
	lobby.WinnerDismissedBy[userID] = true
	s.tryClearPendingResultIfAllDismissed(lobby)
	s.lobbyRepository.SaveLobby(lobby)
}

func (s *GameService) OnUserLeftLobby(lobby *entity.Lobby, userID uuid.UUID) {
	if lobby.ResultContinuedBy != nil {
		delete(lobby.ResultContinuedBy, userID)
	}
	if lobby.WinnerDismissedBy != nil {
		delete(lobby.WinnerDismissedBy, userID)
	}
	s.tryClearPendingResultIfAllDismissed(lobby)
}

func (s *GameService) EndGameOnLeave(lobby *entity.Lobby) {
	if !lobby.InProgress {
		return
	}
	s.resetRoundState(lobby)
	s.clearResultState(lobby)
	lobby.InProgress = false
	s.lobbyRepository.SaveLobby(lobby)
}

func (s *GameService) GetGameStateForUser(userID *uuid.UUID) dto.GameStateDto {
	s.lobbyRepository.Lock()
	defer s.lobbyRepository.Unlock()

	lobby, ok := s.lobbyRepository.FindFirstByOrderByIDAsc()
	if !ok {
		return dto.GameStateDto{CanStart: true}
	}
	return s.toGameState(lobby, userID)
}

func (s *GameService) startCountdownLocked(lobby *entity.Lobby) {
	endsAt := time.Now().Add(countdownDuration)
	lobby.Phase = entity.PhaseCountdown
	lobby.CountdownEndsAt = &endsAt
	s.scheduleAfter(countdownDuration, entity.PhaseCountdown, func(current *entity.Lobby) {
		s.transitionToRevealLocked(current)
	})
}

func (s *GameService) transitionToRevealLocked(lobby *entity.Lobby) {
	lobby.Phase = entity.PhaseReveal
	lobby.CountdownEndsAt = nil
	s.applyRoundOutcomeLocked(lobby)
	lobby.ResultContinuedBy = make(map[uuid.UUID]bool)
	lobby.WinnerDismissedBy = make(map[uuid.UUID]bool)
	s.lobbyRepository.SaveLobby(lobby)
}

func (s *GameService) applyRoundOutcomeLocked(lobby *entity.Lobby) {
	users := s.lobbyRepository.FindByLobbyOrderByJoinedAtAsc(lobby)
	if len(users) < 2 {
		return
	}

	firstChoice, ok1 := lobby.Choices[users[0].ID]
	secondChoice, ok2 := lobby.Choices[users[1].ID]
	if !ok1 || !ok2 {
		return
	}

	choice1, _ := domain.ParseChoice(firstChoice)
	choice2, _ := domain.ParseChoice(secondChoice)
	outcome := domain.ResolveRound(choice1, choice2)

	lobby.WinnerID = nil
	lobby.WinnerNickname = ""
	lobby.DrawPending = false

	switch outcome {
	case domain.OutcomeDraw:
		lobby.DrawPending = true
	case domain.OutcomeFirstWins:
		winnerID := users[0].ID
		lobby.WinnerID = &winnerID
		lobby.WinnerNickname = users[0].Nickname
	case domain.OutcomeSecondWins:
		winnerID := users[1].ID
		lobby.WinnerID = &winnerID
		lobby.WinnerNickname = users[1].Nickname
	}
}

func (s *GameService) scheduleAfter(delay time.Duration, expectedPhase entity.Phase, fn func(*entity.Lobby)) {
	time.AfterFunc(delay, func() {
		s.lobbyRepository.Lock()

		lobby, ok := s.lobbyRepository.FindFirstByOrderByIDAsc()
		if !ok || lobby.Phase != expectedPhase {
			s.lobbyRepository.Unlock()
			return
		}

		fn(lobby)
		s.lobbyRepository.Unlock()

		if s.onStateChange != nil {
			s.onStateChange()
		}
	})
}

func (s *GameService) allPlayersHaveChoices(lobby *entity.Lobby) bool {
	users := s.lobbyRepository.FindByLobbyOrderByJoinedAtAsc(lobby)
	if len(users) < minPlayers {
		return false
	}
	for _, user := range users {
		if _, ok := lobby.Choices[user.ID]; !ok {
			return false
		}
	}
	return true
}

func (s *GameService) allPlayersContinuedToResult(lobby *entity.Lobby) bool {
	users := s.lobbyRepository.FindByLobbyOrderByJoinedAtAsc(lobby)
	if len(users) == 0 {
		return false
	}
	for _, user := range users {
		if lobby.ResultContinuedBy == nil || !lobby.ResultContinuedBy[user.ID] {
			return false
		}
	}
	return true
}

func (s *GameService) resetRoundState(lobby *entity.Lobby) {
	lobby.Phase = ""
	lobby.Choices = nil
	lobby.CountdownEndsAt = nil
}

func (s *GameService) clearResultState(lobby *entity.Lobby) {
	lobby.WinnerID = nil
	lobby.WinnerNickname = ""
	lobby.DrawPending = false
	lobby.WinnerDismissedBy = nil
	lobby.ResultContinuedBy = nil
}

func (s *GameService) getLobbyLocked() (*entity.Lobby, error) {
	lobby, ok := s.lobbyRepository.FindFirstByOrderByIDAsc()
	if !ok {
		return nil, fmt.Errorf("Lobby not found.")
	}
	return lobby, nil
}

func (s *GameService) canStartLocked(lobby *entity.Lobby) bool {
	return lobby.WinnerID == nil && !lobby.DrawPending
}

func (s *GameService) showResultModalLocked(lobby *entity.Lobby, userID *uuid.UUID) bool {
	if (lobby.WinnerID == nil && !lobby.DrawPending) || userID == nil {
		return false
	}
	if !s.allPlayersContinuedToResult(lobby) {
		return false
	}
	if lobby.WinnerDismissedBy == nil {
		return true
	}
	return !lobby.WinnerDismissedBy[*userID]
}

func (s *GameService) tryClearPendingResultIfAllDismissed(lobby *entity.Lobby) {
	if lobby.WinnerID == nil && !lobby.DrawPending {
		return
	}
	users := s.lobbyRepository.FindByLobbyOrderByJoinedAtAsc(lobby)
	if len(users) == 0 {
		s.clearResultState(lobby)
		return
	}
	for _, user := range users {
		if !lobby.WinnerDismissedBy[user.ID] {
			return
		}
	}
	s.clearResultState(lobby)
}

func (s *GameService) toGameState(lobby *entity.Lobby, userID *uuid.UUID) dto.GameStateDto {
	state := dto.GameStateDto{
		InProgress:      lobby.InProgress,
		Phase:           string(lobby.Phase),
		CountdownEndsAt: lobby.CountdownEndsAt,
		WinnerID:        lobby.WinnerID,
		WinnerNickname:  lobby.WinnerNickname,
		DrawPending:     lobby.DrawPending,
		CanStart:        s.canStartLocked(lobby),
		ShowResultModal: s.showResultModalLocked(lobby, userID),
	}

	if userID == nil {
		return state
	}

	if lobby.ResultContinuedBy != nil {
		state.ContinuedToResult = lobby.ResultContinuedBy[*userID]
	}

	if lobby.Choices != nil {
		if choice, ok := lobby.Choices[*userID]; ok {
			c := choice
			state.MyChoice = &c
		}
	}

	if lobby.Phase == entity.PhaseReveal && lobby.Choices != nil {
		users := s.lobbyRepository.FindByLobbyOrderByJoinedAtAsc(lobby)
		for _, user := range users {
			if user.ID == *userID {
				continue
			}
			if choice, ok := lobby.Choices[user.ID]; ok {
				c := choice
				state.OpponentChoice = &c
				break
			}
		}
	}

	return state
}
