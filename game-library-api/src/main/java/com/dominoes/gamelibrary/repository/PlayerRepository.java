package com.dominoes.gamelibrary.repository;

import com.dominoes.gamelibrary.domain.Player;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PlayerRepository extends JpaRepository<Player, UUID> {

    Optional<Player> findByUser(String user);

    boolean existsByUser(String user);
}
