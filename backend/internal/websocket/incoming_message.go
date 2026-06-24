package websocket

import (
	"encoding/json"
)

type IncomingMessage struct {
	Type     string `json:"type"`
	Nickname string `json:"nickname"`
	Piece    string `json:"piece"`
	Side     string `json:"side"`
}

func ParseIncomingMessage(data []byte) (IncomingMessage, error) {
	var msg IncomingMessage
	err := json.Unmarshal(data, &msg)
	return msg, err
}
