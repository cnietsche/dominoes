package com.dominoes.lobby.service;

import com.dominoes.lobby.domain.PieceEnum;
import com.dominoes.lobby.entity.User;

record DoubleOpening(User user, PieceEnum piece) {
}
