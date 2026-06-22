package com.dominoes.lobby.websocket;

import com.fasterxml.jackson.databind.JsonNode;

public record IncomingMessage(
        String type,
        String nickname
) {
    public static IncomingMessage from(JsonNode node) {
        String type = node.has("type") ? node.get("type").asText() : null;
        String nickname = node.has("nickname") ? node.get("nickname").asText() : null;
        return new IncomingMessage(type, nickname);
    }
}
