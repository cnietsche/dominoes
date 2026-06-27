package presence

import (
	"log"
	"net/http"
	"time"
)

type RefreshClient struct {
	url    string
	secret string
	client *http.Client
}

func NewRefreshClient(url, secret string) *RefreshClient {
	return &RefreshClient{
		url:    url,
		secret: secret,
		client: &http.Client{Timeout: 3 * time.Second},
	}
}

func (c *RefreshClient) NotifyLobbyChanged() {
	if c.url == "" {
		return
	}

	go func() {
		req, err := http.NewRequest(http.MethodPost, c.url, nil)
		if err != nil {
			log.Printf("presence refresh: failed to create request: %v", err)
			return
		}
		req.Header.Set("X-Internal-Secret", c.secret)

		resp, err := c.client.Do(req)
		if err != nil {
			log.Printf("presence refresh: request failed: %v", err)
			return
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusNoContent {
			log.Printf("presence refresh: unexpected status %d", resp.StatusCode)
		}
	}()
}
