package com.dominoes.lobby.service;

import com.dominoes.lobby.domain.PieceEnum;
import com.dominoes.lobby.domain.TableSide;
import com.dominoes.lobby.dto.GameStateDto;
import com.dominoes.lobby.entity.Lobby;
import com.dominoes.lobby.entity.User;
import com.dominoes.lobby.exception.GameAlreadyInProgressException;
import com.dominoes.lobby.exception.GameNotInProgressException;
import com.dominoes.lobby.exception.NotYourTurnException;
import com.dominoes.lobby.exception.PieceNotInHandException;
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
        lobby.setTable(new ArrayList<>());
        lobby.setInProgress(true);

        Optional<DoubleOpening> doubleOpening = findDoubleOpening(users);
        if (doubleOpening.isPresent()) {
            DoubleOpening opening = doubleOpening.get();
            opening.user().getHand().remove(opening.piece());
            userRepository.save(opening.user());
            lobby.getTable().add(opening.piece());
            lobby.setCurrentPlayerId(opening.user().getId());
            advanceTurn(lobby, users);
        } else {
            PieceEnum openingPiece = drawFromBoneyard(lobby);
            lobby.getTable().add(openingPiece);
            lobby.setCurrentPlayerId(users.get(random.nextInt(users.size())).getId());
        }

        lobbyRepository.save(lobby);

        return toGameState(lobby);
    }

    @Transactional
    public synchronized GameStateDto playPiece(UUID userId, PieceEnum piece, TableSide side) {
        Lobby lobby = getLobby();
        if (!lobby.isInProgress()) {
            throw new GameNotInProgressException();
        }
        if (!userId.equals(lobby.getCurrentPlayerId())) {
            throw new NotYourTurnException();
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalStateException("Jogador não encontrado."));

        List<PieceEnum> hand = user.getHand();
        if (!hand.contains(piece)) {
            throw new PieceNotInHandException();
        }

        hand.remove(piece);
        if (side == TableSide.LEFT) {
            lobby.getTable().add(0, piece);
        } else {
            lobby.getTable().add(piece);
        }
        userRepository.save(user);

        List<User> users = userRepository.findByLobbyOrderByJoinedAtAsc(lobby);
        advanceTurn(lobby, users);
        lobbyRepository.save(lobby);

        return toGameState(lobby, userId);
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
        allPieces.addAll(lobby.getTable());
        List<User> users = userRepository.findByLobbyOrderByJoinedAtAsc(lobby);
        for (User user : users) {
            allPieces.addAll(user.getHand());
            user.setHand(new ArrayList<>());
            userRepository.save(user);
        }

        lobby.setBoneyard(allPieces);
        lobby.getTable().clear();
        lobby.setInProgress(false);
        lobby.setCurrentPlayerId(null);
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
                .orElse(new GameStateDto(false, 0, List.of(), null, List.of()));
    }

    private Optional<DoubleOpening> findDoubleOpening(List<User> users) {
        for (PieceEnum doublePiece : PieceEnum.DOUBLES_BY_PRIORITY) {
            for (User user : users) {
                if (user.getHand().contains(doublePiece)) {
                    return Optional.of(new DoubleOpening(user, doublePiece));
                }
            }
        }
        return Optional.empty();
    }

    private PieceEnum drawFromBoneyard(Lobby lobby) {
        List<PieceEnum> boneyard = lobby.getBoneyard();
        int pieceIndex = random.nextInt(boneyard.size());
        return boneyard.remove(pieceIndex);
    }

    private void advanceTurn(Lobby lobby, List<User> users) {
        if (users.isEmpty()) {
            return;
        }
        UUID current = lobby.getCurrentPlayerId();
        int currentIndex = -1;
        for (int i = 0; i < users.size(); i++) {
            if (users.get(i).getId().equals(current)) {
                currentIndex = i;
                break;
            }
        }
        if (currentIndex == -1) {
            lobby.setCurrentPlayerId(users.getFirst().getId());
        } else {
            int nextIndex = (currentIndex + 1) % users.size();
            lobby.setCurrentPlayerId(users.get(nextIndex).getId());
        }
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
        List<String> table = lobby.getTable().stream().map(PieceEnum::getCode).toList();
        return new GameStateDto(
                lobby.isInProgress(),
                lobby.getBoneyard().size(),
                hand,
                lobby.getCurrentPlayerId(),
                table
        );
    }
}
