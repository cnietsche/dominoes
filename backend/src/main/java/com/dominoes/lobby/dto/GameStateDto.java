package com.dominoes.lobby.dto;

import java.util.List;

public record GameStateDto(
        boolean inProgress,
        int boneyardCount,
        List<String> hand
) {
}
