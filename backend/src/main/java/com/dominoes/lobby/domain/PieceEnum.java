package com.dominoes.lobby.domain;

import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

public enum PieceEnum {
    ZERO_ZERO("0-0"),
    ZERO_ONE("0-1"),
    ONE_ONE("1-1"),
    ZERO_TWO("0-2"),
    ONE_TWO("1-2"),
    TWO_TWO("2-2"),
    ZERO_THREE("0-3"),
    ONE_THREE("1-3"),
    TWO_THREE("2-3"),
    THREE_THREE("3-3"),
    ZERO_FOUR("0-4"),
    ONE_FOUR("1-4"),
    TWO_FOUR("2-4"),
    THREE_FOUR("3-4"),
    FOUR_FOUR("4-4"),
    ZERO_FIVE("0-5"),
    ONE_FIVE("1-5"),
    TWO_FIVE("2-5"),
    THREE_FIVE("3-5"),
    FOUR_FIVE("4-5"),
    FIVE_FIVE("5-5"),
    ZERO_SIX("0-6"),
    ONE_SIX("1-6"),
    TWO_SIX("2-6"),
    THREE_SIX("3-6"),
    FOUR_SIX("4-6"),
    FIVE_SIX("5-6"),
    SIX_SIX("6-6");

    public static final List<PieceEnum> DOUBLES_BY_PRIORITY = List.of(
            SIX_SIX, FIVE_FIVE, FOUR_FOUR, THREE_THREE, TWO_TWO, ONE_ONE, ZERO_ZERO
    );

    private static final Map<String, PieceEnum> BY_CODE = Arrays.stream(values())
            .collect(Collectors.toMap(PieceEnum::getCode, Function.identity()));

    private final String code;

    PieceEnum(String code) {
        this.code = code;
    }

    @JsonValue
    public String getCode() {
        return code;
    }

    public static PieceEnum fromCode(String code) {
        PieceEnum piece = BY_CODE.get(code);
        if (piece == null) {
            throw new IllegalArgumentException("Unknown piece code: " + code);
        }
        return piece;
    }

    public static PieceEnum[] fullSet() {
        return values();
    }
}
