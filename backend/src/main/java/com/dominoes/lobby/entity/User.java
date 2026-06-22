package com.dominoes.lobby.entity;

import com.dominoes.lobby.domain.PieceEnum;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class User {

    @Id
    private UUID id;

    @Column(nullable = false)
    private String nickname;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "lobby_id", nullable = false)
    private Lobby lobby;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_hand", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "piece", nullable = false)
    @OrderColumn(name = "piece_order")
    private List<PieceEnum> hand = new ArrayList<>();

    public User(String nickname, Lobby lobby) {
        this.id = UUID.randomUUID();
        this.nickname = nickname;
        this.lobby = lobby;
    }
}
