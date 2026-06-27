export interface LobbyUser {
  id: string;
  nickname: string;
}

export interface LobbyStatePayload {
  lobbyId: string;
  size: number;
  users: LobbyUser[];
}

export type GameChoice = 'rock' | 'paper' | 'scissors';

export type GamePhase = 'choosing' | 'countdown' | 'reveal' | '';

export interface GameStatePayload {
  inProgress: boolean;
  phase: GamePhase;
  myChoice: GameChoice | null;
  opponentChoice: GameChoice | null;
  countdownEndsAt: string | null;
  winnerId: string | null;
  winnerNickname: string | null;
  drawPending: boolean;
  continuedToResult: boolean;
  canStart: boolean;
  showResultModal: boolean;
}

export type OutgoingMessageType =
  | 'JOIN'
  | 'LEAVE'
  | 'START_GAME'
  | 'SUBMIT_CHOICE'
  | 'CONTINUE_TO_RESULT'
  | 'DISMISS_WINNER';

export interface OutgoingMessage {
  type: OutgoingMessageType;
  nickname?: string;
  choice?: GameChoice;
}

export type IncomingMessageType =
  | 'LOBBY_STATE'
  | 'JOIN_ACK'
  | 'START_GAME_ACK'
  | 'SUBMIT_CHOICE_ACK'
  | 'CONTINUE_TO_RESULT_ACK'
  | 'GAME_STATE'
  | 'ERROR';

export interface IncomingMessage {
  type: IncomingMessageType;
  payload: Record<string, unknown>;
}
