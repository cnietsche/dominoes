package com.dominoes.lobby.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "lobby")
@Getter
@Setter
@NoArgsConstructor
public class Lobby {

    @Id
    private UUID id;

    @Column(nullable = false)
    private Integer size;

    public Lobby(Integer size) {
        this.id = UUID.randomUUID();
        this.size = size;
    }
}
