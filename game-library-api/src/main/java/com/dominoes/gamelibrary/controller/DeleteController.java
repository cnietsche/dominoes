package com.dominoes.gamelibrary.controller;

import com.dominoes.gamelibrary.service.PlayerService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class DeleteController {

    private final PlayerService playerService;

    public DeleteController(PlayerService playerService) {
        this.playerService = playerService;
    }

    @RequestMapping(value = "/delete", method = { RequestMethod.GET, RequestMethod.DELETE })
    public Map<String, String> deleteAllPlayers() {
        long deleted = playerService.deleteAllPlayers();
        return Map.of("message", "Deleted " + deleted + " player(s)");
    }
}
