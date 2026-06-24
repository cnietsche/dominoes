package websocket

import (
	"github.com/dominoes/lobby/internal/dto"
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
	currentPlayer := ""
	if state.CurrentPlayerID != nil {
		currentPlayer = state.CurrentPlayerID.String()
	}
	table := make([]map[string]string, len(state.Table))
	for i, piece := range state.Table {
		table[i] = map[string]string{
			"code":     piece.Code,
			"rotation": piece.Rotation,
		}
	}
	return OutgoingMessage{
		Type: "GAME_STATE",
		Payload: map[string]any{
			"inProgress":      state.InProgress,
			"boneyardCount":   state.BoneyardCount,
			"hand":            state.Hand,
			"currentPlayer":   currentPlayer,
			"table":           table,
			"drawnThisTurn":   state.DrawnThisTurn,
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

func PlayPieceAck() OutgoingMessage {
	return OutgoingMessage{Type: "PLAY_PIECE_ACK", Payload: map[string]any{}}
}

func DrawFromBoneyardAck() OutgoingMessage {
	return OutgoingMessage{Type: "DRAW_FROM_BONEYARD_ACK", Payload: map[string]any{}}
}

func EndGameAck() OutgoingMessage {
	return OutgoingMessage{Type: "END_GAME_ACK", Payload: map[string]any{}}
}

func ErrorMessage(message string) OutgoingMessage {
	return OutgoingMessage{
		Type:    "ERROR",
		Payload: map[string]any{"message": message},
	}
}
