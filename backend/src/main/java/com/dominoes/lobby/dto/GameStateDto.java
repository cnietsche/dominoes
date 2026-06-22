package com.dominoes.lobby.dto;

public record GameStateDto(
        boolean inProgress,
        int boneyardCount
) {
}
