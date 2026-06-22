package com.dominoes.lobby.exception;

public class GameNotInProgressException extends RuntimeException {

    public GameNotInProgressException() {
        super("Não há partida em andamento.");
    }
}
