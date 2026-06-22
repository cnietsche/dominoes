package com.dominoes.lobby.exception;

public class GameAlreadyInProgressException extends RuntimeException {

    public GameAlreadyInProgressException() {
        super("A partida já foi iniciada.");
    }
}
