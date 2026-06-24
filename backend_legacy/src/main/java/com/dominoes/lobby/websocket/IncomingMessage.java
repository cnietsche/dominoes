package com.dominoes.lobby.websocket;

import com.fasterxml.jackson.databind.JsonNode;

public record IncomingMessage(
        String type,
        String nickname,
        String piece,
        String side
) {
    public static IncomingMessage from(JsonNode node) {
        String type = node.has("type") ? node.get("type").asText() : null;
        String nickname = node.has("nickname") ? node.get("nickname").asText() : null;
        String piece = node.has("piece") ? node.get("piece").asText() : null;
        String side = node.has("side") ? node.get("side").asText() : null;
        return new IncomingMessage(type, nickname, piece, side);
    }
}
