package com.dominoes.lobby.exception;

public class GameInProgressException extends RuntimeException {

    public GameInProgressException() {
        super("A partida já está em andamento.");
    }
}
