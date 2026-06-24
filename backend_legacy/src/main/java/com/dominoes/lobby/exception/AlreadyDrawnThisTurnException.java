package com.dominoes.lobby.exception;

public class AlreadyDrawnThisTurnException extends RuntimeException {

    public AlreadyDrawnThisTurnException() {
        super("Você já comprou uma peça neste turno.");
    }
}
