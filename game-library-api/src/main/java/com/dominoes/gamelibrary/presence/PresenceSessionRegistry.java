package com.dominoes.gamelibrary.presence;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketSession;

import java.util.Collection;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class PresenceSessionRegistry {

    private final Map<UUID, Set<String>> playerSessions = new ConcurrentHashMap<>();
    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
    private final Map<String, UUID> sessionToPlayer = new ConcurrentHashMap<>();

    public void register(WebSocketSession session, UUID playerId) {
        String sessionId = session.getId();
        sessions.put(sessionId, session);
        sessionToPlayer.put(sessionId, playerId);
        playerSessions.computeIfAbsent(playerId, ignored -> ConcurrentHashMap.newKeySet()).add(sessionId);
    }

    public void unregister(String sessionId) {
        sessions.remove(sessionId);
        UUID playerId = sessionToPlayer.remove(sessionId);
        if (playerId == null) {
            return;
        }

        Set<String> playerSessionIds = playerSessions.get(playerId);
        if (playerSessionIds == null) {
            return;
        }

        playerSessionIds.remove(sessionId);
        if (playerSessionIds.isEmpty()) {
            playerSessions.remove(playerId);
        }
    }

    public int countLibraryPlayers() {
        return playerSessions.size();
    }

    public Collection<WebSocketSession> getAllSessions() {
        return sessions.values();
    }
}
