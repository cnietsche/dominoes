package com.dominoes.lobby.exception;

public class BoneyardEmptyException extends RuntimeException {

    public BoneyardEmptyException() {
        super("Não há mais peças no monte.");
    }
}
