package com.nitx.gamelibrary.presence;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final PresenceWebSocketHandler presenceWebSocketHandler;
    private final PresenceHandshakeInterceptor presenceHandshakeInterceptor;

    public WebSocketConfig(
            PresenceWebSocketHandler presenceWebSocketHandler,
            PresenceHandshakeInterceptor presenceHandshakeInterceptor) {
        this.presenceWebSocketHandler = presenceWebSocketHandler;
        this.presenceHandshakeInterceptor = presenceHandshakeInterceptor;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(presenceWebSocketHandler, "/ws/presence")
                .addInterceptors(presenceHandshakeInterceptor)
                .setAllowedOrigins("*");
    }
}
