package com.dominoes.gamelibrary.domain;

public enum GameEnum {

    DOMINOES("Dominoes", "/icons/dominoes.png");

    private final String name;
    private final String image;

    GameEnum(String name, String image) {
        this.name = name;
        this.image = image;
    }

    public String getName() {
        return name;
    }

    public String getImage() {
        return image;
    }
}
