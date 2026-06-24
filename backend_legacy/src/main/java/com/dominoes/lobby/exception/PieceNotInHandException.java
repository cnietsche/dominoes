package com.dominoes.lobby.exception;

public class PieceNotInHandException extends RuntimeException {

    public PieceNotInHandException() {
        super("Você não possui essa peça na mão.");
    }
}
