package com.dominoes.lobby.service;

import com.dominoes.lobby.domain.PieceEnum;
import com.dominoes.lobby.dto.GameStateDto;
import com.dominoes.lobby.entity.Lobby;
import com.dominoes.lobby.entity.User;
import com.dominoes.lobby.exception.GameAlreadyInProgressException;
import com.dominoes.lobby.exception.GameNotInProgressException;
import com.dominoes.lobby.repository.LobbyRepository;
import com.dominoes.lobby.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GameService {

    private static final int HAND_SIZE = 7;

    private final LobbyRepository lobbyRepository;
    private final UserRepository userRepository;
    private final Random random = new Random();

    @Transactional
    public synchronized GameStateDto startGame() {
        Lobby lobby = getLobby();
        if (lobby.isInProgress()) {
            throw new GameAlreadyInProgressException();
        }

        List<User> users = userRepository.findByLobbyOrderByJoinedAtAsc(lobby);
        if (users.isEmpty()) {
            throw new IllegalStateException("Não há jogadores no lobby.");
        }

        List<PieceEnum> deck = new ArrayList<>(Arrays.asList(PieceEnum.fullSet()));
        Collections.shuffle(deck);

        for (User user : users) {
            List<PieceEnum> hand = new ArrayList<>();
            for (int i = 0; i < HAND_SIZE; i++) {
                hand.add(deck.removeFirst());
            }
            user.setHand(hand);
            userRepository.save(user);
        }

        lobby.setBoneyard(new ArrayList<>(deck));
        lobby.setInProgress(true);

        Optional<User> doubleOwner = determineFirstPlayer(users);
        if (doubleOwner.isPresent()) {
            lobby.setCurrentPlayerId(doubleOwner.get().getId());
            lobby.setOpeningPiece(null);
        } else {
            User startingPlayer = resolveOpeningWithoutDouble(lobby, users);
            lobby.setCurrentPlayerId(startingPlayer.getId());
        }

        lobbyRepository.save(lobby);

        return toGameState(lobby);
    }

    @Transactional
    public synchronized GameStateDto finishGame() {
        Lobby lobby = getLobby();
        if (!lobby.isInProgress()) {
            throw new GameNotInProgressException();
        }
        endGame(lobby);
        return toGameState(lobby);
    }

    @Transactional
    public synchronized void endGame(Lobby lobby) {
        if (!lobby.isInProgress()) {
            return;
        }

        List<PieceEnum> allPieces = new ArrayList<>(lobby.getBoneyard());
        if (lobby.getOpeningPiece() != null) {
            allPieces.add(lobby.getOpeningPiece());
        }
        List<User> users = userRepository.findByLobbyOrderByJoinedAtAsc(lobby);
        for (User user : users) {
            allPieces.addAll(user.getHand());
            user.setHand(new ArrayList<>());
            userRepository.save(user);
        }

        lobby.setBoneyard(allPieces);
        lobby.setInProgress(false);
        lobby.setCurrentPlayerId(null);
        lobby.setOpeningPiece(null);
        lobbyRepository.save(lobby);
    }

    @Transactional(readOnly = true)
    public GameStateDto getGameState() {
        return getGameStateForUser(null);
    }

    @Transactional(readOnly = true)
    public GameStateDto getGameStateForUser(UUID userId) {
        return lobbyRepository.findFirstByOrderByIdAsc()
                .map(lobby -> toGameState(lobby, userId))
                .orElse(new GameStateDto(false, 0, List.of(), null, null));
    }

    private Optional<User> determineFirstPlayer(List<User> users) {
        for (PieceEnum doublePiece : PieceEnum.DOUBLES_BY_PRIORITY) {
            for (User user : users) {
                if (user.getHand().contains(doublePiece)) {
                    return Optional.of(user);
                }
            }
        }
        return Optional.empty();
    }

    private User resolveOpeningWithoutDouble(Lobby lobby, List<User> users) {
        List<PieceEnum> boneyard = lobby.getBoneyard();
        int pieceIndex = random.nextInt(boneyard.size());
        PieceEnum openingPiece = boneyard.remove(pieceIndex);
        lobby.setOpeningPiece(openingPiece);

        int playerIndex = random.nextInt(users.size());
        return users.get(playerIndex);
    }

    private Lobby getLobby() {
        return lobbyRepository.findFirstByOrderByIdAsc()
                .orElseThrow(() -> new IllegalStateException("Lobby não encontrado."));
    }

    private GameStateDto toGameState(Lobby lobby) {
        return toGameState(lobby, null);
    }

    private GameStateDto toGameState(Lobby lobby, UUID userId) {
        List<String> hand = List.of();
        if (userId != null && lobby.isInProgress()) {
            hand = userRepository.findById(userId)
                    .map(user -> user.getHand().stream().map(PieceEnum::getCode).toList())
                    .orElse(List.of());
        }
        String openingPiece = lobby.getOpeningPiece() != null
                ? lobby.getOpeningPiece().getCode()
                : null;
        return new GameStateDto(
                lobby.isInProgress(),
                lobby.getBoneyard().size(),
                hand,
                lobby.getCurrentPlayerId(),
                openingPiece
        );
    }
}
