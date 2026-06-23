package com.dominoes.lobby.entity;

import com.dominoes.lobby.domain.PieceEnum;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
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

    @Column(nullable = false)
    private boolean inProgress = false;

    @Column(name = "current_player_id")
    private UUID currentPlayerId;

    @Column(name = "opening_piece")
    private PieceEnum openingPiece;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "lobby_boneyard", joinColumns = @JoinColumn(name = "lobby_id"))
    @Column(name = "piece", nullable = false)
    @OrderColumn(name = "piece_order")
    private List<PieceEnum> boneyard = new ArrayList<>();

    public Lobby(Integer size) {
        this.id = UUID.randomUUID();
        this.size = size;
    }
}
