package com.dominoes.gamelibrary.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.util.UUID;

@Entity
@Table(name = "players")
public class Player {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_login", nullable = false, unique = true)
    private String user;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String password;

    protected Player() {
    }

    public Player(String user, String name, String password) {
        this.user = user;
        this.name = name;
        this.password = password;
    }

    public UUID getId() {
        return id;
    }

    public String getUser() {
        return user;
    }

    public String getName() {
        return name;
    }

    public String getPassword() {
        return password;
    }
}
