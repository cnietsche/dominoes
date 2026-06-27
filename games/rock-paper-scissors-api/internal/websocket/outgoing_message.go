package websocket

import (
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

func JoinAck(userID uuid.UUID) OutgoingMessage {
	return OutgoingMessage{
		Type:    "JOIN_ACK",
		Payload: map[string]any{"userId": userID.String()},
	}
}

func ErrorMessage(message string) OutgoingMessage {
	return OutgoingMessage{
		Type:    "ERROR",
		Payload: map[string]any{"message": message},
	}
}
