package com.dominoes.lobby.entity;

import com.dominoes.lobby.domain.PieceEnum;
import com.dominoes.lobby.domain.PieceRotation;
import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
public class TablePiece {

    @Enumerated(EnumType.STRING)
    @Column(name = "piece", nullable = false)
    private PieceEnum piece;

    @Enumerated(EnumType.STRING)
    @Column(name = "rotation", nullable = false)
    private PieceRotation rotation;

    public TablePiece(PieceEnum piece, PieceRotation rotation) {
        this.piece = piece;
        this.rotation = rotation;
    }
}
