package com.dominoes.lobby.dto;

import java.util.List;
import java.util.UUID;

public record GameStateDto(
        boolean inProgress,
        int boneyardCount,
        List<String> hand,
        UUID currentPlayerId,
        List<TablePieceDto> table,
        boolean drawnThisTurn
) {
}
