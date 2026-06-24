package com.dominoes.gamelibrary.controller;

import com.dominoes.gamelibrary.dto.LoginRequest;
import com.dominoes.gamelibrary.dto.LoginResponse;
import com.dominoes.gamelibrary.dto.PlayerDto;
import com.dominoes.gamelibrary.dto.RegisterRequest;
import com.dominoes.gamelibrary.service.PlayerService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final PlayerService playerService;

    public AuthController(PlayerService playerService) {
        this.playerService = playerService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public void register(@RequestBody RegisterRequest request) {
        playerService.register(request);
    }

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request) {
        return playerService.login(request);
    }

    @GetMapping("/me")
    public PlayerDto me(Authentication authentication) {
        UUID playerId = (UUID) authentication.getPrincipal();
        return playerService.getPlayer(playerId);
    }
}
