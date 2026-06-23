package com.dominoes.lobby.exception;

public class HasPlayablePieceException extends RuntimeException {

    public HasPlayablePieceException() {
        super("Você possui peças jogáveis e deve jogar.");
    }
}
