package com.dominoes.lobby.websocket;

import com.dominoes.lobby.dto.GameStateDto;
import com.dominoes.lobby.dto.LobbyStateDto;
import com.dominoes.lobby.dto.TablePieceDto;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

public record OutgoingMessage(
        String type,
        Map<String, Object> payload
) {
    public static OutgoingMessage lobbyState(LobbyStateDto state) {
        return new OutgoingMessage("LOBBY_STATE", Map.of(
                "lobbyId", state.lobbyId() != null ? state.lobbyId().toString() : "",
                "size", state.size(),
                "users", state.users()
        ));
    }

    public static OutgoingMessage gameState(GameStateDto state) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("inProgress", state.inProgress());
        payload.put("boneyardCount", state.boneyardCount());
        payload.put("hand", state.hand());
        payload.put("currentPlayer", state.currentPlayerId() != null ? state.currentPlayerId().toString() : "");
        payload.put("table", state.table().stream().map(OutgoingMessage::tablePiece).toList());
        return new OutgoingMessage("GAME_STATE", payload);
    }

    private static Map<String, String> tablePiece(TablePieceDto piece) {
        return Map.of("code", piece.code(), "rotation", piece.rotation());
    }

    public static OutgoingMessage joinAck(UUID userId) {
        return new OutgoingMessage("JOIN_ACK", Map.of("userId", userId.toString()));
    }

    public static OutgoingMessage startGameAck() {
        return new OutgoingMessage("START_GAME_ACK", Map.of());
    }

    public static OutgoingMessage playPieceAck() {
        return new OutgoingMessage("PLAY_PIECE_ACK", Map.of());
    }

    public static OutgoingMessage drawFromBoneyardAck() {
        return new OutgoingMessage("DRAW_FROM_BONEYARD_ACK", Map.of());
    }

    public static OutgoingMessage endGameAck() {
        return new OutgoingMessage("END_GAME_ACK", Map.of());
    }

    public static OutgoingMessage error(String message) {
        return new OutgoingMessage("ERROR", Map.of("message", message));
    }
}
