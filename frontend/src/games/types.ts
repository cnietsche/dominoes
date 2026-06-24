import type { ComponentType } from 'react';

export interface GameModuleProps {
  displayName: string;
  onExit: () => void;
}

export interface GameModule {
  Component: ComponentType<GameModuleProps>;
}
