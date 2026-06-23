package com.dominoes.lobby.exception;

public class NotYourTurnException extends RuntimeException {

    public NotYourTurnException() {
        super("Não é a sua vez de jogar.");
    }
}
