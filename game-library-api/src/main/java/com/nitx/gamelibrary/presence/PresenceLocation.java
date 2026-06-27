package com.nitx.gamelibrary.presence;

public enum PresenceLocation {
    LIBRARY,
    GAME;

    public static PresenceLocation fromString(String value) {
        if (value == null) {
            return LIBRARY;
        }
        try {
            return PresenceLocation.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            return LIBRARY;
        }
    }
}
