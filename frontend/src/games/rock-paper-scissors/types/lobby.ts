export interface LobbyUser {
  id: string;
  nickname: string;
}

export interface LobbyStatePayload {
  lobbyId: string;
  size: number;
  users: LobbyUser[];
}

export interface OutgoingMessage {
  type: 'JOIN' | 'LEAVE';
  nickname?: string;
}

export interface IncomingMessage {
  type: 'LOBBY_STATE' | 'JOIN_ACK' | 'ERROR';
  payload: Record<string, unknown>;
}
