export interface LobbyUser {
  id: string;
  nickname: string;
}

export interface LobbyStatePayload {
  lobbyId: string;
  size: number;
  users: LobbyUser[];
}

export type OutgoingMessageType = 'JOIN' | 'LEAVE';

export interface OutgoingMessage {
  type: OutgoingMessageType;
  nickname?: string;
}

export type IncomingMessageType = 'LOBBY_STATE' | 'JOIN_ACK' | 'ERROR';

export interface IncomingMessage {
  type: IncomingMessageType;
  payload: Record<string, unknown>;
}
