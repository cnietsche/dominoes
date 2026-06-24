import type { GameModule } from './types';

export const gameRegistry: Record<string, () => Promise<{ default: GameModule }>> = {
  DOMINOES: () => import('./dominoes'),
};
