package com.dominoes.lobby.dto;

import java.util.UUID;

public record UserDto(
        UUID id,
        String nickname,
        Integer handCount
) {
}
