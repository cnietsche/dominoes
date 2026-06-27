package com.nitx.gamelibrary.service;

import com.nitx.gamelibrary.domain.Player;
import com.nitx.gamelibrary.dto.LoginRequest;
import com.nitx.gamelibrary.dto.LoginResponse;
import com.nitx.gamelibrary.dto.PlayerDto;
import com.nitx.gamelibrary.dto.RegisterRequest;
import com.nitx.gamelibrary.exception.InvalidCredentialsException;
import com.nitx.gamelibrary.exception.UserAlreadyExistsException;
import com.nitx.gamelibrary.repository.PlayerRepository;
import com.nitx.gamelibrary.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class PlayerService {

    private final PlayerRepository playerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public PlayerService(
            PlayerRepository playerRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {
        this.playerRepository = playerRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public void register(RegisterRequest request) {
        if (playerRepository.existsByUser(request.user())) {
            throw new UserAlreadyExistsException(request.user());
        }

        String hashedPassword = passwordEncoder.encode(request.password());
        Player player = new Player(request.user(), request.name(), hashedPassword);
        playerRepository.save(player);
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        Player player = playerRepository.findByUser(request.user())
                .orElseThrow(InvalidCredentialsException::new);

        if (!passwordEncoder.matches(request.password(), player.getPassword())) {
            throw new InvalidCredentialsException();
        }

        String token = jwtService.generateToken(player.getId(), player.getUser());
        return new LoginResponse(player.getId(), player.getName(), token);
    }

    @Transactional(readOnly = true)
    public PlayerDto getPlayer(UUID playerId) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(InvalidCredentialsException::new);
        return toDto(player);
    }

    @Transactional
    public long deleteAllPlayers() {
        long count = playerRepository.count();
        playerRepository.deleteAll();
        return count;
    }

    private PlayerDto toDto(Player player) {
        return new PlayerDto(player.getId(), player.getName());
    }
}
