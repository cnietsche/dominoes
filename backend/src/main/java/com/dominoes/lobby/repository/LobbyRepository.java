package com.dominoes.lobby.repository;

import com.dominoes.lobby.entity.Lobby;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface LobbyRepository extends JpaRepository<Lobby, UUID> {

    Optional<Lobby> findFirstByOrderByIdAsc();
}
