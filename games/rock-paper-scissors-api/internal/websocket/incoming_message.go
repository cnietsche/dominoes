package websocket

import (
	"encoding/json"
)

type IncomingMessage struct {
	Type     string `json:"type"`
	Nickname string `json:"nickname"`
	Choice   string `json:"choice"`
}

func ParseIncomingMessage(data []byte) (IncomingMessage, error) {
	var msg IncomingMessage
	err := json.Unmarshal(data, &msg)
	return msg, err
}
