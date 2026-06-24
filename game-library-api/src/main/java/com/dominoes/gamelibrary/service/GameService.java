package com.dominoes.gamelibrary.service;

import com.dominoes.gamelibrary.domain.GameEnum;
import com.dominoes.gamelibrary.dto.GameDto;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

@Service
public class GameService {

    public List<GameDto> listGames() {
        return Arrays.stream(GameEnum.values())
                .map(this::toDto)
                .toList();
    }

    private GameDto toDto(GameEnum game) {
        return new GameDto(game.name(), game.getName(), game.getImage());
    }
}
