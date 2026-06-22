package com.dominoes.lobby.websocket;

import com.dominoes.lobby.dto.LobbyStateDto;
import com.dominoes.lobby.entity.User;
import com.dominoes.lobby.exception.GameAlreadyInProgressException;
import com.dominoes.lobby.exception.GameInProgressException;
import com.dominoes.lobby.exception.LobbyFullException;
import com.dominoes.lobby.service.GameService;
import com.dominoes.lobby.service.LobbyService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class LobbyWebSocketHandler extends TextWebSocketHandler {

    private final LobbyService lobbyService;
    private final GameService gameService;
    private final LobbySessionRegistry sessionRegistry;
    private final ObjectMapper objectMapper;

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        sessionRegistry.registerSession(session);
        log.info("WebSocket connected: {}", session.getId());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        IncomingMessage incoming = IncomingMessage.from(objectMapper.readTree(message.getPayload()));
        String sessionId = session.getId();

        synchronized (session) {
            switch (incoming.type()) {
                case "JOIN" -> handleJoin(session, sessionId, incoming.nickname());
                case "LEAVE" -> handleLeave(session, sessionId);
                case "START_GAME" -> handleStartGame(session, sessionId);
                default -> sendToSession(session, OutgoingMessage.error("Tipo de mensagem desconhecido."));
            }
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String sessionId = session.getId();
        sessionRegistry.findUserId(sessionId).ifPresent(userId -> {
            lobbyService.leaveLobby(userId);
            broadcastLobbyState();
            broadcastGameState();
            log.info("User {} removed on disconnect (session {})", userId, sessionId);
        });
        sessionRegistry.unregisterSession(sessionId);
        log.info("WebSocket disconnected: {}", sessionId);
    }

    private void handleJoin(WebSocketSession session, String sessionId, String nickname) throws IOException {
        if (nickname == null || nickname.isBlank()) {
            sendToSession(session, OutgoingMessage.error("Nickname é obrigatório."));
            return;
        }

        if (sessionRegistry.findUserId(sessionId).isPresent()) {
            sendToSession(session, OutgoingMessage.error("Você já está no lobby."));
            return;
        }

        try {
            User user = lobbyService.joinLobby(nickname);
            sessionRegistry.bindUser(sessionId, user.getId());
            sendToSession(session, OutgoingMessage.joinAck(user.getId()));
            broadcastLobbyState();
            log.info("User {} joined lobby", user.getId());
        } catch (LobbyFullException | GameInProgressException ex) {
            sendToSession(session, OutgoingMessage.error(ex.getMessage()));
        }
    }

    private void handleLeave(WebSocketSession session, String sessionId) throws IOException {
        sessionRegistry.findUserId(sessionId).ifPresent(userId -> {
            lobbyService.leaveLobby(userId);
            sessionRegistry.unbindUser(sessionId);
            log.info("User {} left lobby", userId);
        });
        broadcastLobbyState();
        broadcastGameState();
        sendToSession(session, OutgoingMessage.lobbyState(lobbyService.getLobbyState()));
        sendToSession(session, OutgoingMessage.gameState(gameService.getGameState()));
    }

    private void handleStartGame(WebSocketSession session, String sessionId) throws IOException {
        if (sessionRegistry.findUserId(sessionId).isEmpty()) {
            sendToSession(session, OutgoingMessage.error("Você precisa estar no lobby para iniciar a partida."));
            return;
        }

        try {
            gameService.startGame();
            sendToSession(session, OutgoingMessage.startGameAck());
            broadcastGameState();
            log.info("Game started by session {}", sessionId);
        } catch (GameAlreadyInProgressException ex) {
            sendToSession(session, OutgoingMessage.error(ex.getMessage()));
        }
    }

    private void broadcastLobbyState() {
        LobbyStateDto state = lobbyService.getLobbyState();
        OutgoingMessage message = OutgoingMessage.lobbyState(state);
        sessionRegistry.getAllSessions().forEach(target -> {
            try {
                sendToSession(target, message);
            } catch (IOException ex) {
                log.warn("Failed to broadcast lobby state to session {}", target.getId(), ex);
            }
        });
    }

    private void broadcastGameState() {
        OutgoingMessage message = OutgoingMessage.gameState(gameService.getGameState());
        sessionRegistry.getAllSessions().forEach(target -> {
            try {
                sendToSession(target, message);
            } catch (IOException ex) {
                log.warn("Failed to broadcast game state to session {}", target.getId(), ex);
            }
        });
    }

    private void sendToSession(WebSocketSession session, OutgoingMessage message) throws IOException {
        if (session.isOpen()) {
            session.sendMessage(new TextMessage(objectMapper.writeValueAsString(message)));
        }
    }
}
