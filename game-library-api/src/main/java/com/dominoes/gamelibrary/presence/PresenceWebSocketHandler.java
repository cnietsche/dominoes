package com.dominoes.gamelibrary.presence;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.UUID;

@Component
public class PresenceWebSocketHandler extends TextWebSocketHandler {

    private final PresenceSessionRegistry registry;
    private final PresenceBroadcastService broadcastService;

    public PresenceWebSocketHandler(
            PresenceSessionRegistry registry,
            PresenceBroadcastService broadcastService) {
        this.registry = registry;
        this.broadcastService = broadcastService;
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
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        registry.unregister(session.getId());
        broadcastService.broadcast();
    }
}
