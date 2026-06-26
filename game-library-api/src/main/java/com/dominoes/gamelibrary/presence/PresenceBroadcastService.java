package com.dominoes.gamelibrary.presence;

import com.dominoes.gamelibrary.dto.GameLobbyInfoDto;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class PresenceBroadcastService {

    private final PresenceSessionRegistry registry;
    private final GameStatsClient gameStatsClient;
    private final ObjectMapper objectMapper;

    public PresenceBroadcastService(
            PresenceSessionRegistry registry,
            GameStatsClient gameStatsClient,
            ObjectMapper objectMapper) {
        this.registry = registry;
        this.gameStatsClient = gameStatsClient;
        this.objectMapper = objectMapper;
    }

    public void broadcast() {
        Map<String, GameLobbyInfoDto> gameLobbies = gameStatsClient.fetchGameLobbies();
        int lobbyCount = gameLobbies.values().stream().mapToInt(GameLobbyInfoDto::count).sum();
        int libraryCount = registry.countLibraryPlayers();
        int total = libraryCount + lobbyCount;

        Map<String, Object> gameLobbiesPayload = new LinkedHashMap<>();
        for (Map.Entry<String, GameLobbyInfoDto> entry : gameLobbies.entrySet()) {
            GameLobbyInfoDto info = entry.getValue();
            Map<String, Integer> lobbyPayload = new LinkedHashMap<>();
            lobbyPayload.put("count", info.count());
            lobbyPayload.put("max", info.max());
            lobbyPayload.put("min", info.min());
            gameLobbiesPayload.put(entry.getKey(), lobbyPayload);
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("type", "PRESENCE_STATS");
        payload.put("libraryCount", libraryCount);
        payload.put("gameLobbies", gameLobbiesPayload);
        payload.put("total", total);

        String message;
        try {
            message = objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            return;
        }

        TextMessage textMessage = new TextMessage(message);
        for (WebSocketSession session : registry.getAllSessions()) {
            if (session.isOpen()) {
                try {
                    session.sendMessage(textMessage);
                } catch (IOException ignored) {
                    // session will be cleaned up on close
                }
            }
        }
    }

    @Scheduled(fixedRate = 5_000)
    public void scheduledBroadcast() {
        if (!registry.getAllSessions().isEmpty()) {
            broadcast();
        }
    }
}
