import { Suspense, lazy, useMemo } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { gameRegistry } from '../games/registry';
import type { PlayerDto } from '../types/auth';

interface GameRouteProps {
  player: PlayerDto;
}

export function GameRoute({ player }: GameRouteProps) {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();

  const GameComponent = useMemo(() => {
    if (!gameId) {
      return null;
    }

    const loader = gameRegistry[gameId.toUpperCase()];
    if (!loader) {
      return null;
    }

    return lazy(async () => {
      const module = await loader();
      return { default: module.default.Component };
    });
  }, [gameId]);

  if (!gameId || !GameComponent) {
    return <Navigate to="/" replace />;
  }

  return (
    <Suspense
      fallback={
        <div className="safe-area-x safe-area-top safe-area-bottom flex min-h-dvh items-center justify-center">
          <p className="text-slate-400">Loading game...</p>
        </div>
      }
    >
      <GameComponent
        displayName={player.name}
        onExit={() => navigate('/')}
      />
    </Suspense>
  );
}
