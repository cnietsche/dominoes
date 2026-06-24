package com.dominoes.lobby.websocket;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketSession;

import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class LobbySessionRegistry {

    private final Map<String, UUID> sessionToUser = new ConcurrentHashMap<>();
    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();

    public void registerSession(WebSocketSession session) {
        sessions.put(session.getId(), session);
    }

    public void unregisterSession(String sessionId) {
        sessions.remove(sessionId);
        sessionToUser.remove(sessionId);
    }

    public void bindUser(String sessionId, UUID userId) {
        sessionToUser.put(sessionId, userId);
    }

    public void unbindUser(String sessionId) {
        sessionToUser.remove(sessionId);
    }

    public Optional<UUID> findUserId(String sessionId) {
        return Optional.ofNullable(sessionToUser.get(sessionId));
    }

    public Set<WebSocketSession> getAllSessions() {
        return Set.copyOf(sessions.values());
    }
}
