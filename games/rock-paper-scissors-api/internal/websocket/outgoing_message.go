package websocket

import (
	"time"

	"github.com/dominoes/rock-paper-scissors-api/internal/dto"
	"github.com/google/uuid"
)

type OutgoingMessage struct {
	Type    string         `json:"type"`
	Payload map[string]any `json:"payload"`
}

func LobbyState(state dto.LobbyStateDto) OutgoingMessage {
	lobbyID := ""
	if state.LobbyID != nil {
		lobbyID = state.LobbyID.String()
	}
	return OutgoingMessage{
		Type: "LOBBY_STATE",
		Payload: map[string]any{
			"lobbyId": lobbyID,
			"size":    state.Size,
			"users":   state.Users,
		},
	}
}

func GameState(state dto.GameStateDto) OutgoingMessage {
	winnerID := ""
	winnerNickname := ""
	if state.WinnerID != nil {
		winnerID = state.WinnerID.String()
		winnerNickname = state.WinnerNickname
	}

	var myChoice any = nil
	if state.MyChoice != nil {
		myChoice = *state.MyChoice
	}
	var opponentChoice any = nil
	if state.OpponentChoice != nil {
		opponentChoice = *state.OpponentChoice
	}
	var countdownEndsAt any = nil
	if state.CountdownEndsAt != nil {
		countdownEndsAt = state.CountdownEndsAt.UTC().Format(time.RFC3339Nano)
	}

	return OutgoingMessage{
		Type: "GAME_STATE",
		Payload: map[string]any{
			"inProgress":       state.InProgress,
			"phase":            state.Phase,
			"myChoice":         myChoice,
			"opponentChoice":   opponentChoice,
			"countdownEndsAt":  countdownEndsAt,
			"winnerId":         winnerID,
			"winnerNickname":   winnerNickname,
			"drawPending":       state.DrawPending,
			"continuedToResult": state.ContinuedToResult,
			"canStart":          state.CanStart,
			"showResultModal":  state.ShowResultModal,
		},
	}
}

func JoinAck(userID uuid.UUID) OutgoingMessage {
	return OutgoingMessage{
		Type:    "JOIN_ACK",
		Payload: map[string]any{"userId": userID.String()},
	}
}

func StartGameAck() OutgoingMessage {
	return OutgoingMessage{Type: "START_GAME_ACK", Payload: map[string]any{}}
}

func SubmitChoiceAck() OutgoingMessage {
	return OutgoingMessage{Type: "SUBMIT_CHOICE_ACK", Payload: map[string]any{}}
}

func ContinueToResultAck() OutgoingMessage {
	return OutgoingMessage{Type: "CONTINUE_TO_RESULT_ACK", Payload: map[string]any{}}
}

func ErrorMessage(message string) OutgoingMessage {
	return OutgoingMessage{
		Type:    "ERROR",
		Payload: map[string]any{"message": message},
	}
}
