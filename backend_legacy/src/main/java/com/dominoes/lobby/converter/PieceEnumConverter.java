package com.dominoes.lobby.converter;

import com.dominoes.lobby.domain.PieceEnum;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class PieceEnumConverter implements AttributeConverter<PieceEnum, String> {

    @Override
    public String convertToDatabaseColumn(PieceEnum piece) {
        return piece == null ? null : piece.getCode();
    }

    @Override
    public PieceEnum convertToEntityAttribute(String code) {
        return code == null ? null : PieceEnum.fromCode(code);
    }
}
