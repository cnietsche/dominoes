package com.dominoes.gamelibrary.dto;

public record GameOnlineStatsDto(String gameId, int count, int lobbySize, int minPlayers) {
}