package com.dominoes.gamelibrary.controller;

import com.dominoes.gamelibrary.dto.GameDto;
import com.dominoes.gamelibrary.service.GameService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/games")
public class GameController {

    private final GameService gameService;

    public GameController(GameService gameService) {
        this.gameService = gameService;
    }

    @GetMapping
    public List<GameDto> listGames() {
        return gameService.listGames();
    }
}
