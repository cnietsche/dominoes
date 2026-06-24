package com.dominoes.gamelibrary.dto;

import java.util.UUID;

public record LoginResponse(UUID id, String name, String token) {
}
