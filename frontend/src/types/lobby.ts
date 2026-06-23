export interface LobbyUser {
  id: string;
  nickname: string;
  handCount?: number | null;
}

export interface LobbyStatePayload {
  lobbyId: string;
  size: number;
  users: LobbyUser[];
}

export type TableSide = 'LEFT' | 'RIGHT';

export interface GameStatePayload {
  inProgress: boolean;
  boneyardCount: number;
  hand: string[];
  currentPlayer: string | null;
  table: string[];
}

export type OutgoingMessageType =
  | 'JOIN'
  | 'LEAVE'
  | 'START_GAME'
  | 'END_GAME'
  | 'PLAY_PIECE';

export interface OutgoingMessage {
  type: OutgoingMessageType;
  nickname?: string;
  piece?: string;
  side?: TableSide;
}

export type IncomingMessageType =
  | 'LOBBY_STATE'
  | 'JOIN_ACK'
  | 'START_GAME_ACK'
  | 'END_GAME_ACK'
  | 'PLAY_PIECE_ACK'
  | 'GAME_STATE'
  | 'ERROR';

export interface IncomingMessage {
  type: IncomingMessageType;
  payload: Record<string, unknown>;
}
