package com.dominoes.lobby.exception;

public class PieceDoesNotMatchException extends RuntimeException {

    public PieceDoesNotMatchException() {
        super("A peça não encaixa nesta extremidade.");
    }
}
