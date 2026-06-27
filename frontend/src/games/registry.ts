import type { GameModule } from './types';

export const gameRegistry: Record<string, () => Promise<{ default: GameModule }>> = {
  DOMINOES: () => import('./dominoes'),
  ROCK_PAPER_SCISSORS: () => import('./rock-paper-scissors'),
};
