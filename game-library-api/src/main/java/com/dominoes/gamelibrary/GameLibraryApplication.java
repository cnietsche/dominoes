package com.dominoes.gamelibrary;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class GameLibraryApplication {

    public static void main(String[] args) {
        SpringApplication.run(GameLibraryApplication.class, args);
    }
}
