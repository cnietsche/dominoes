package com.nitx.gamelibrary.presence;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.UUID;

@Component
public class PresenceWebSocketHandler extends TextWebSocketHandler {

    private final PresenceSessionRegistry registry;
    private final PresenceBroadcastService broadcastService;
    private final ObjectMapper objectMapper;

    public PresenceWebSocketHandler(
            PresenceSessionRegistry registry,
            PresenceBroadcastService broadcastService,
            ObjectMapper objectMapper) {
        this.registry = registry;
        this.broadcastService = broadcastService;
        this.objectMapper = objectMapper;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        UUID playerId = (UUID) session.getAttributes().get(PresenceHandshakeInterceptor.PLAYER_ID_ATTRIBUTE);
        if (playerId == null) {
            return;
        }

        registry.register(session, playerId);
        broadcastService.broadcast();
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        try {
            JsonNode payload = objectMapper.readTree(message.getPayload());
            if (!"LOCATION".equals(payload.path("type").asText())) {
                return;
            }

            PresenceLocation location = PresenceLocation.fromString(payload.path("location").asText());
            registry.setLocation(session.getId(), location);
            broadcastService.broadcast();
        } catch (Exception ignored) {
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        registry.unregister(session.getId());
        broadcastService.broadcast();
    }
}
