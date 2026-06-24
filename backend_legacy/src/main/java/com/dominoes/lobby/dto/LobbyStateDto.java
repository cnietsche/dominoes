package com.dominoes.lobby.dto;

import java.util.List;
import java.util.UUID;

public record LobbyStateDto(
        UUID lobbyId,
        int size,
        List<UserDto> users
) {
}
