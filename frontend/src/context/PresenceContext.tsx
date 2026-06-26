import { createContext, useContext, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import {
  usePresenceWebSocket,
  type GameLobbyInfo,
  type PresenceLocation,
} from '../hooks/usePresenceWebSocket';

export interface PresenceContextValue {
  libraryCount: number;
  gameLobbies: Record<string, GameLobbyInfo>;
  total: number;
  connected: boolean;
}

const PresenceContext = createContext<PresenceContextValue | null>(null);

function resolvePresenceLocation(pathname: string): PresenceLocation {
  return pathname.startsWith('/games/') ? 'GAME' : 'LIBRARY';
}

interface PresenceProviderProps {
  token: string;
  children: ReactNode;
}

export function PresenceProvider({ token, children }: PresenceProviderProps) {
  const { pathname } = useLocation();
  const location = resolvePresenceLocation(pathname);
  const value = usePresenceWebSocket(token, location);

  return (
    <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>
  );
}

export function usePresence(): PresenceContextValue {
  const context = useContext(PresenceContext);
  if (!context) {
    throw new Error('usePresence must be used within a PresenceProvider');
  }
  return context;
}
