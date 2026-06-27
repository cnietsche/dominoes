package com.nitx.gamelibrary.presence;

import com.nitx.gamelibrary.dto.GameLobbyInfoDto;
import com.nitx.gamelibrary.dto.GameOnlineStatsDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class GameStatsClient {

    private final RestClient restClient;
    private final String dominoesStatsUrl;
    private final String rockPaperScissorsStatsUrl;

    public GameStatsClient(
            @Value("${games.dominoes.stats-url}") String dominoesStatsUrl,
            @Value("${games.rock-paper-scissors.stats-url}") String rockPaperScissorsStatsUrl) {
        this.dominoesStatsUrl = dominoesStatsUrl;
        this.rockPaperScissorsStatsUrl = rockPaperScissorsStatsUrl;
        this.restClient = RestClient.create();
    }

    public Map<String, GameLobbyInfoDto> fetchGameLobbies() {
        Map<String, GameLobbyInfoDto> gameLobbies = new LinkedHashMap<>();

        fetchStats(gameLobbies, dominoesStatsUrl, "DOMINOES", 4, 1);
        fetchStats(gameLobbies, rockPaperScissorsStatsUrl, "ROCK_PAPER_SCISSORS", 2, 2);

        return gameLobbies;
    }

    private void fetchStats(
            Map<String, GameLobbyInfoDto> gameLobbies,
            String statsUrl,
            String fallbackGameId,
            int fallbackMax,
            int fallbackMin) {
        try {
            GameOnlineStatsDto stats = restClient.get()
                    .uri(statsUrl)
                    .retrieve()
                    .body(GameOnlineStatsDto.class);
            if (stats != null && stats.gameId() != null) {
                gameLobbies.put(
                        stats.gameId(),
                        new GameLobbyInfoDto(stats.count(), stats.lobbySize(), stats.minPlayers()));
                return;
            }
        } catch (Exception ignored) {
        }
        gameLobbies.putIfAbsent(fallbackGameId, new GameLobbyInfoDto(0, fallbackMax, fallbackMin));
    }
}
