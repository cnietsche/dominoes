package com.dominoes.lobby.service;

import com.dominoes.lobby.dto.LobbyStateDto;
import com.dominoes.lobby.dto.UserDto;
import com.dominoes.lobby.entity.Lobby;
import com.dominoes.lobby.entity.User;
import com.dominoes.lobby.exception.GameInProgressException;
import com.dominoes.lobby.exception.LobbyFullException;
import com.dominoes.lobby.repository.LobbyRepository;
import com.dominoes.lobby.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LobbyService {

    private final LobbyRepository lobbyRepository;
    private final UserRepository userRepository;
    private final GameService gameService;

    @Value("${lobby.size}")
    private int lobbySize;

    @Transactional
    public synchronized User joinLobby(String nickname) {
        Lobby lobby = getOrCreateLobby();
        if (lobby.isInProgress()) {
            throw new GameInProgressException();
        }
        long currentCount = userRepository.countByLobby(lobby);
        if (currentCount >= lobby.getSize()) {
            throw new LobbyFullException();
        }

        User user = new User(nickname.trim(), lobby);
        return userRepository.save(user);
    }

    @Transactional
    public synchronized void leaveLobby(UUID userId) {
        userRepository.findById(userId).ifPresent(user -> {
            Lobby lobby = user.getLobby();
            if (lobby.isInProgress()) {
                gameService.endGame(lobby);
            }
            userRepository.deleteById(userId);
        });
    }

    @Transactional(readOnly = true)
    public LobbyStateDto getLobbyState() {
        return lobbyRepository.findFirstByOrderByIdAsc()
                .map(this::toLobbyState)
                .orElse(new LobbyStateDto(null, lobbySize, List.of()));
    }

    private Lobby getOrCreateLobby() {
        return lobbyRepository.findFirstByOrderByIdAsc()
                .orElseGet(() -> lobbyRepository.save(new Lobby(lobbySize)));
    }

    private LobbyStateDto toLobbyState(Lobby lobby) {
        List<UserDto> users = userRepository.findByLobbyOrderByNicknameAsc(lobby).stream()
                .map(user -> new UserDto(user.getId(), user.getNickname()))
                .toList();
        return new LobbyStateDto(lobby.getId(), lobby.getSize(), users);
    }
}
