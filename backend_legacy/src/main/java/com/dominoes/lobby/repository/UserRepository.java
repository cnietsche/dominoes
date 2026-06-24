package com.dominoes.lobby.repository;

import com.dominoes.lobby.entity.Lobby;
import com.dominoes.lobby.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    long countByLobby(Lobby lobby);

    List<User> findByLobbyOrderByJoinedAtAsc(Lobby lobby);
}
