package com.nitx.gamelibrary.dto;

public record GameOnlineStatsDto(String gameId, int count, int lobbySize, int minPlayers) {
}