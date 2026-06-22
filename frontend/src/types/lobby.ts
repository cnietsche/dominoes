export interface LobbyUser {
  id: string;
  nickname: string;
}

export interface LobbyStatePayload {
  lobbyId: string;
  size: number;
  users: LobbyUser[];
}

export interface GameStatePayload {
  inProgress: boolean;
  boneyardCount: number;
  hand: string[];
}

export type OutgoingMessageType = 'JOIN' | 'LEAVE' | 'START_GAME' | 'END_GAME';

export interface OutgoingMessage {
  type: OutgoingMessageType;
  nickname?: string;
}

export type IncomingMessageType =
  | 'LOBBY_STATE'
  | 'JOIN_ACK'
  | 'START_GAME_ACK'
  | 'END_GAME_ACK'
  | 'GAME_STATE'
  | 'ERROR';

export interface IncomingMessage {
  type: IncomingMessageType;
  payload: Record<string, unknown>;
}
