package service

import (
	"fmt"
	"math/rand"
	"slices"

	"github.com/dominoes/dominoes-api/internal/domain"
	"github.com/dominoes/dominoes-api/internal/dto"
	"github.com/dominoes/dominoes-api/internal/entity"
	"github.com/dominoes/dominoes-api/internal/exception"
	"github.com/dominoes/dominoes-api/internal/repository"
	"github.com/google/uuid"
)

const handSize = 7

type gameEndType int

const (
	endNormal gameEndType = iota
	endWin
	endDraw
)

type GameService struct {
	lobbyRepository *repository.LobbyRepository
	random          *rand.Rand
}

func NewGameService(lobbyRepository *repository.LobbyRepository) *GameService {
	return &GameService{
		lobbyRepository: lobbyRepository,
		random:          rand.New(rand.NewSource(rand.Int63())),
	}
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
	if len(users) == 0 {
		return dto.GameStateDto{}, fmt.Errorf("There are no players in the lobby.")
	}

	deck := slices.Clone(domain.FullSet())
	s.random.Shuffle(len(deck), func(i, j int) {
		deck[i], deck[j] = deck[j], deck[i]
	})

	deckIndex := 0
	for _, user := range users {
		hand := make([]domain.PieceEnum, handSize)
		for i := 0; i < handSize; i++ {
			hand[i] = deck[deckIndex]
			deckIndex++
		}
		user.Hand = hand
		s.lobbyRepository.SaveUser(user)
	}

	lobby.Boneyard = deck[deckIndex:]
	lobby.Table = []entity.TablePiece{}
	lobby.DrawnThisTurn = false
	lobby.InProgress = true
	lobby.WinnerID = nil
	lobby.WinnerNickname = ""
	lobby.DrawPending = false
	lobby.WinnerDismissedBy = nil

	if opening, ok := s.findDoubleOpening(users); ok {
		user := opening.User
		removePieceFromHand(user, opening.Piece)
		s.lobbyRepository.SaveUser(user)
		lobby.Table = append(lobby.Table, s.createOpeningPiece(opening.Piece))
		lobby.CurrentPlayerID = &user.ID
		s.advanceTurn(lobby, users)
	} else {
		openingPiece := s.removeRandomFromBoneyard(lobby)
		lobby.Table = append(lobby.Table, s.createOpeningPiece(openingPiece))
		randomUser := users[s.random.Intn(len(users))]
		lobby.CurrentPlayerID = &randomUser.ID
		s.resolveCurrentPlayerTurn(lobby, users)
	}

	s.lobbyRepository.SaveLobby(lobby)
	return s.toGameState(lobby, nil), nil
}

func (s *GameService) PlayPiece(userID uuid.UUID, piece domain.PieceEnum, side domain.TableSide) (dto.GameStateDto, error) {
	s.lobbyRepository.Lock()
	defer s.lobbyRepository.Unlock()

	lobby, err := s.getLobbyLocked()
	if err != nil {
		return dto.GameStateDto{}, err
	}
	if !lobby.InProgress {
		return dto.GameStateDto{}, &exception.GameNotInProgressError{}
	}
	if lobby.CurrentPlayerID == nil || *lobby.CurrentPlayerID != userID {
		return dto.GameStateDto{}, &exception.NotYourTurnError{}
	}

	user, ok := s.lobbyRepository.FindUserByID(userID)
	if !ok {
		return dto.GameStateDto{}, fmt.Errorf("Player not found.")
	}

	if !containsPiece(user.Hand, piece) {
		return dto.GameStateDto{}, &exception.PieceNotInHandError{}
	}

	table := lobby.Table
	var connectValue int
	if side == domain.TableSideLeft {
		connectValue = s.exposedLeftValue(table[0])
	} else {
		connectValue = s.exposedRightValue(table[len(table)-1])
	}
	if !piece.MatchesPip(connectValue) {
		return dto.GameStateDto{}, &exception.PieceDoesNotMatchError{}
	}

	user.Hand = removePiece(user.Hand, piece)
	if side == domain.TableSideLeft {
		lobby.Table = append([]entity.TablePiece{s.createPieceConnectingOnRight(piece, connectValue)}, table...)
	} else {
		lobby.Table = append(table, s.createPieceConnectingOnLeft(piece, connectValue))
	}
	s.lobbyRepository.SaveUser(user)

	if len(user.Hand) == 0 {
		s.endGameLocked(lobby, user, endWin)
	} else {
		users := s.lobbyRepository.FindByLobbyOrderByJoinedAtAsc(lobby)
		s.advanceTurn(lobby, users)
	}
	s.lobbyRepository.SaveLobby(lobby)

	return s.toGameState(lobby, &userID), nil
}

func (s *GameService) DrawFromBoneyard(userID uuid.UUID) (dto.GameStateDto, error) {
	s.lobbyRepository.Lock()
	defer s.lobbyRepository.Unlock()

	lobby, err := s.getLobbyLocked()
	if err != nil {
		return dto.GameStateDto{}, err
	}
	if !lobby.InProgress {
		return dto.GameStateDto{}, &exception.GameNotInProgressError{}
	}
	if lobby.CurrentPlayerID == nil || *lobby.CurrentPlayerID != userID {
		return dto.GameStateDto{}, &exception.NotYourTurnError{}
	}
	if lobby.DrawnThisTurn {
		return dto.GameStateDto{}, &exception.AlreadyDrawnThisTurnError{}
	}

	user, ok := s.lobbyRepository.FindUserByID(userID)
	if !ok {
		return dto.GameStateDto{}, fmt.Errorf("Player not found.")
	}

	if s.hasPlayablePiece(user.Hand, lobby.Table) {
		return dto.GameStateDto{}, &exception.HasPlayablePieceError{}
	}
	if len(lobby.Boneyard) == 0 {
		return dto.GameStateDto{}, &exception.BoneyardEmptyError{}
	}

	drawnIndex := s.random.Intn(len(lobby.Boneyard))
	drawn := lobby.Boneyard[drawnIndex]
	lobby.Boneyard = append(lobby.Boneyard[:drawnIndex], lobby.Boneyard[drawnIndex+1:]...)
	user.Hand = append(user.Hand, drawn)
	lobby.DrawnThisTurn = true
	s.lobbyRepository.SaveUser(user)

	users := s.lobbyRepository.FindByLobbyOrderByJoinedAtAsc(lobby)
	if !s.hasPlayablePiece(user.Hand, lobby.Table) {
		s.advanceTurn(lobby, users)
	}

	s.lobbyRepository.SaveLobby(lobby)
	return s.toGameState(lobby, &userID), nil
}

func (s *GameService) FinishGame() (dto.GameStateDto, error) {
	s.lobbyRepository.Lock()
	defer s.lobbyRepository.Unlock()

	lobby, err := s.getLobbyLocked()
	if err != nil {
		return dto.GameStateDto{}, err
	}
	if !lobby.InProgress {
		return dto.GameStateDto{}, &exception.GameNotInProgressError{}
	}
	s.endGameLocked(lobby, nil, endNormal)
	return s.toGameState(lobby, nil), nil
}

func (s *GameService) EndGame(lobby *entity.Lobby) {
	s.lobbyRepository.Lock()
	defer s.lobbyRepository.Unlock()
	s.endGameLocked(lobby, nil, endNormal)
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
	if lobby.WinnerDismissedBy != nil {
		delete(lobby.WinnerDismissedBy, userID)
	}
	s.tryClearPendingResultIfAllDismissed(lobby)
}

func (s *GameService) endGameLocked(lobby *entity.Lobby, winner *entity.User, endType gameEndType) {
	if !lobby.InProgress {
		return
	}

	allPieces := slices.Clone(lobby.Boneyard)
	for _, tablePiece := range lobby.Table {
		allPieces = append(allPieces, tablePiece.Piece)
	}
	users := s.lobbyRepository.FindByLobbyOrderByJoinedAtAsc(lobby)
	for _, user := range users {
		allPieces = append(allPieces, user.Hand...)
		user.Hand = []domain.PieceEnum{}
		s.lobbyRepository.SaveUser(user)
	}

	lobby.Boneyard = allPieces
	lobby.Table = []entity.TablePiece{}
	lobby.InProgress = false
	lobby.CurrentPlayerID = nil
	lobby.DrawnThisTurn = false
	lobby.WinnerID = nil
	lobby.WinnerNickname = ""
	lobby.DrawPending = false
	lobby.WinnerDismissedBy = nil

	switch endType {
	case endWin:
		if winner != nil {
			winnerID := winner.ID
			lobby.WinnerID = &winnerID
			lobby.WinnerNickname = winner.Nickname
			lobby.WinnerDismissedBy = make(map[uuid.UUID]bool)
		}
	case endDraw:
		lobby.DrawPending = true
		lobby.WinnerDismissedBy = make(map[uuid.UUID]bool)
	}
	s.lobbyRepository.SaveLobby(lobby)
}

func (s *GameService) GetGameState() dto.GameStateDto {
	return s.GetGameStateForUser(nil)
}

func (s *GameService) GetGameStateForUser(userID *uuid.UUID) dto.GameStateDto {
	s.lobbyRepository.Lock()
	defer s.lobbyRepository.Unlock()

	lobby, ok := s.lobbyRepository.FindFirstByOrderByIDAsc()
	if !ok {
		return dto.GameStateDto{
			InProgress:    false,
			BoneyardCount: 0,
			Hand:          []string{},
			Table:         []dto.TablePieceDto{},
			DrawnThisTurn: false,
		}
	}
	return s.toGameState(lobby, userID)
}

func (s *GameService) createOpeningPiece(piece domain.PieceEnum) entity.TablePiece {
	if piece.IsDouble() {
		return entity.NewTablePiece(piece, domain.PieceRotationVertical)
	}
	return entity.NewTablePiece(piece, domain.PieceRotationHorizontal)
}

func (s *GameService) createPieceConnectingOnLeft(piece domain.PieceEnum, connectValue int) entity.TablePiece {
	if piece.IsDouble() {
		return entity.NewTablePiece(piece, domain.PieceRotationVertical)
	}
	rotation := s.rotationWithValueOnLeft(piece, connectValue)
	return entity.NewTablePiece(piece, rotation)
}

func (s *GameService) createPieceConnectingOnRight(piece domain.PieceEnum, connectValue int) entity.TablePiece {
	if piece.IsDouble() {
		return entity.NewTablePiece(piece, domain.PieceRotationVertical)
	}
	rotation := s.rotationWithValueOnRight(piece, connectValue)
	return entity.NewTablePiece(piece, rotation)
}

func (s *GameService) rotationWithValueOnLeft(piece domain.PieceEnum, value int) domain.PieceRotation {
	if piece.LeftPip() == value {
		return domain.PieceRotationHorizontal
	}
	if piece.RightPip() == value {
		return domain.PieceRotationHorizontalFlipped
	}
	panic(&exception.PieceDoesNotMatchError{})
}

func (s *GameService) rotationWithValueOnRight(piece domain.PieceEnum, value int) domain.PieceRotation {
	if piece.RightPip() == value {
		return domain.PieceRotationHorizontal
	}
	if piece.LeftPip() == value {
		return domain.PieceRotationHorizontalFlipped
	}
	panic(&exception.PieceDoesNotMatchError{})
}

func (s *GameService) hasPlayablePiece(hand []domain.PieceEnum, table []entity.TablePiece) bool {
	if len(table) == 0 || len(hand) == 0 {
		return false
	}
	leftEnd := s.exposedLeftValue(table[0])
	rightEnd := s.exposedRightValue(table[len(table)-1])
	for _, piece := range hand {
		if piece.MatchesPip(leftEnd) || piece.MatchesPip(rightEnd) {
			return true
		}
	}
	return false
}

func (s *GameService) canDrawFromBoneyard(lobby *entity.Lobby) bool {
	return !lobby.DrawnThisTurn && len(lobby.Boneyard) > 0
}

func (s *GameService) resolveCurrentPlayerTurn(lobby *entity.Lobby, users []*entity.User) {
	for skipped := 0; skipped < len(users); skipped++ {
		current := s.findCurrentUser(lobby, users)
		if current == nil {
			return
		}
		if s.hasPlayablePiece(current.Hand, lobby.Table) || s.canDrawFromBoneyard(lobby) {
			return
		}
		s.moveToNextPlayer(lobby, users)
		lobby.DrawnThisTurn = false
	}
}

func (s *GameService) findCurrentUser(lobby *entity.Lobby, users []*entity.User) *entity.User {
	if lobby.CurrentPlayerID == nil {
		return nil
	}
	for _, user := range users {
		if user.ID == *lobby.CurrentPlayerID {
			return user
		}
	}
	return nil
}

func (s *GameService) exposedLeftValue(tablePiece entity.TablePiece) int {
	switch tablePiece.Rotation {
	case domain.PieceRotationVertical, domain.PieceRotationHorizontal:
		return tablePiece.Piece.LeftPip()
	case domain.PieceRotationHorizontalFlipped:
		return tablePiece.Piece.RightPip()
	default:
		return tablePiece.Piece.LeftPip()
	}
}

func (s *GameService) exposedRightValue(tablePiece entity.TablePiece) int {
	switch tablePiece.Rotation {
	case domain.PieceRotationVertical, domain.PieceRotationHorizontal:
		return tablePiece.Piece.RightPip()
	case domain.PieceRotationHorizontalFlipped:
		return tablePiece.Piece.LeftPip()
	default:
		return tablePiece.Piece.RightPip()
	}
}

func (s *GameService) findDoubleOpening(users []*entity.User) (DoubleOpening, bool) {
	for _, doublePiece := range domain.DoublesByPriority {
		for _, user := range users {
			if containsPiece(user.Hand, doublePiece) {
				return DoubleOpening{User: user, Piece: doublePiece}, true
			}
		}
	}
	return DoubleOpening{}, false
}

func (s *GameService) removeRandomFromBoneyard(lobby *entity.Lobby) domain.PieceEnum {
	pieceIndex := s.random.Intn(len(lobby.Boneyard))
	piece := lobby.Boneyard[pieceIndex]
	lobby.Boneyard = append(lobby.Boneyard[:pieceIndex], lobby.Boneyard[pieceIndex+1:]...)
	return piece
}

func (s *GameService) advanceTurn(lobby *entity.Lobby, users []*entity.User) {
	s.moveToNextPlayer(lobby, users)
	lobby.DrawnThisTurn = false
	s.resolveCurrentPlayerTurn(lobby, users)
	s.tryEndGameOnStalemate(lobby, users)
}

func (s *GameService) tryEndGameOnStalemate(lobby *entity.Lobby, users []*entity.User) {
	if !lobby.InProgress {
		return
	}
	if s.isStalemateLocked(lobby, users) {
		s.endGameLocked(lobby, nil, endDraw)
	}
}

func (s *GameService) isStalemateLocked(lobby *entity.Lobby, users []*entity.User) bool {
	if len(lobby.Boneyard) > 0 || len(lobby.Table) == 0 {
		return false
	}
	for _, user := range users {
		if s.hasPlayablePiece(user.Hand, lobby.Table) {
			return false
		}
	}
	return true
}

func (s *GameService) moveToNextPlayer(lobby *entity.Lobby, users []*entity.User) {
	if len(users) == 0 {
		return
	}
	currentID := lobby.CurrentPlayerID
	currentIndex := -1
	for i, user := range users {
		if currentID != nil && user.ID == *currentID {
			currentIndex = i
			break
		}
	}
	if currentIndex == -1 {
		lobby.CurrentPlayerID = &users[0].ID
	} else {
		nextIndex := (currentIndex + 1) % len(users)
		lobby.CurrentPlayerID = &users[nextIndex].ID
	}
}

func (s *GameService) getLobbyLocked() (*entity.Lobby, error) {
	lobby, ok := s.lobbyRepository.FindFirstByOrderByIDAsc()
	if !ok {
		return nil, fmt.Errorf("Lobby not found.")
	}
	return lobby, nil
}

func (s *GameService) toGameState(lobby *entity.Lobby, userID *uuid.UUID) dto.GameStateDto {
	hand := []string{}
	if userID != nil && lobby.InProgress {
		if user, ok := s.lobbyRepository.FindUserByID(*userID); ok {
			hand = make([]string, len(user.Hand))
			for i, piece := range user.Hand {
				hand[i] = piece.Code()
			}
		}
	}

	table := make([]dto.TablePieceDto, len(lobby.Table))
	for i, tp := range lobby.Table {
		table[i] = dto.TablePieceDto{
			Code:     tp.Piece.Code(),
			Rotation: string(tp.Rotation),
		}
	}

	return dto.GameStateDto{
		InProgress:      lobby.InProgress,
		BoneyardCount:   len(lobby.Boneyard),
		Hand:            hand,
		CurrentPlayerID: lobby.CurrentPlayerID,
		Table:           table,
		DrawnThisTurn:   lobby.DrawnThisTurn,
		WinnerID:        lobby.WinnerID,
		WinnerNickname:  lobby.WinnerNickname,
		DrawPending:     lobby.DrawPending,
		CanStart:        s.canStartLocked(lobby),
		ShowResultModal: s.showResultModalLocked(lobby, userID),
	}
}

func (s *GameService) canStartLocked(lobby *entity.Lobby) bool {
	return lobby.WinnerID == nil && !lobby.DrawPending
}

func (s *GameService) showResultModalLocked(lobby *entity.Lobby, userID *uuid.UUID) bool {
	if (lobby.WinnerID == nil && !lobby.DrawPending) || userID == nil {
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
		lobby.WinnerID = nil
		lobby.WinnerNickname = ""
		lobby.DrawPending = false
		lobby.WinnerDismissedBy = nil
		return
	}
	for _, user := range users {
		if !lobby.WinnerDismissedBy[user.ID] {
			return
		}
	}
	lobby.WinnerID = nil
	lobby.WinnerNickname = ""
	lobby.DrawPending = false
	lobby.WinnerDismissedBy = nil
}

func containsPiece(hand []domain.PieceEnum, piece domain.PieceEnum) bool {
	for _, p := range hand {
		if p == piece {
			return true
		}
	}
	return false
}

func removePiece(hand []domain.PieceEnum, piece domain.PieceEnum) []domain.PieceEnum {
	result := make([]domain.PieceEnum, 0, len(hand)-1)
	for _, p := range hand {
		if p != piece {
			result = append(result, p)
		}
	}
	return result
}

func removePieceFromHand(user *entity.User, piece domain.PieceEnum) {
	user.Hand = removePiece(user.Hand, piece)
}
