package com.dominoes.lobby.exception;

public class LobbyFullException extends RuntimeException {

    public LobbyFullException() {
        super("O lobby está cheio.");
    }
}
