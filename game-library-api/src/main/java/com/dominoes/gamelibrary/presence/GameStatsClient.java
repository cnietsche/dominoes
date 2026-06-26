package com.dominoes.gamelibrary.presence;

import com.dominoes.gamelibrary.dto.GameLobbyInfoDto;
import com.dominoes.gamelibrary.dto.GameOnlineStatsDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class GameStatsClient {

    private final RestClient restClient;
    private final String dominoesStatsUrl;

    public GameStatsClient(@Value("${games.dominoes.stats-url}") String dominoesStatsUrl) {
        this.dominoesStatsUrl = dominoesStatsUrl;
        this.restClient = RestClient.create();
    }

    public Map<String, GameLobbyInfoDto> fetchGameLobbies() {
        Map<String, GameLobbyInfoDto> gameLobbies = new LinkedHashMap<>();

        try {
            GameOnlineStatsDto stats = restClient.get()
                    .uri(dominoesStatsUrl)
                    .retrieve()
                    .body(GameOnlineStatsDto.class);
            if (stats != null && stats.gameId() != null) {
                gameLobbies.put(
                        stats.gameId(),
                        new GameLobbyInfoDto(stats.count(), stats.lobbySize(), stats.minPlayers()));
            }
        } catch (Exception ignored) {
            gameLobbies.put("DOMINOES", new GameLobbyInfoDto(0, 4, 1));
        }

        gameLobbies.putIfAbsent("DOMINOES", new GameLobbyInfoDto(0, 4, 1));
        return gameLobbies;
    }
}
