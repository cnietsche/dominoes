package com.nitx.gamelibrary.controller;

import com.nitx.gamelibrary.presence.PresenceBroadcastService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/presence")
public class InternalPresenceController {

    private final PresenceBroadcastService broadcastService;
    private final String internalApiSecret;

    public InternalPresenceController(
            PresenceBroadcastService broadcastService,
            @Value("${internal.api-secret}") String internalApiSecret) {
        this.broadcastService = broadcastService;
        this.internalApiSecret = internalApiSecret;
    }

    @PostMapping("/refresh")
    public ResponseEntity<Void> refresh(
            @RequestHeader(value = "X-Internal-Secret", required = false) String secret) {
        if (secret == null || !internalApiSecret.equals(secret)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        broadcastService.broadcast();
        return ResponseEntity.noContent().build();
    }
}
