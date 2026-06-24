import { useEffect, useState } from 'react';
import * as gameApi from '../api/gameApi';
import type { GameDto } from '../types/game';

interface GameLibraryPageProps {
  nickname: string;
  token: string;
  onLogoff: () => void;
}

export function GameLibraryPage({ nickname, token, onLogoff }: GameLibraryPageProps) {
  const [games, setGames] = useState<GameDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    gameApi
      .listGames(token)
      .then((items) => {
        if (!cancelled) {
          setGames(items);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Failed to load games';
          setError(message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="safe-area-x safe-area-top relative h-[100px] shrink-0 border-b border-slate-700">
        <div className="flex h-full flex-col justify-center pr-28">
          <h1 className="text-xl font-bold text-white sm:text-2xl">Game library</h1>
          <span className="mt-1 inline-flex w-fit rounded-full border border-slate-600 bg-slate-800 px-3 py-1 text-sm text-slate-300">
            {nickname}
          </span>
        </div>
        <button
          type="button"
          onClick={onLogoff}
          className="absolute right-4 top-1/2 min-h-11 -translate-y-1/2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 active:bg-red-700 sm:right-6 sm:min-h-12 sm:px-5 sm:text-base"
        >
          Logoff
        </button>
      </header>

      <main className="safe-area-x safe-area-bottom flex min-h-0 flex-1 flex-col overflow-y-auto pt-4">
        {loading && <p className="text-slate-400">Loading games...</p>}

        {!loading && error && <p className="text-red-400">{error}</p>}

        {!loading && !error && (
          <ul className="mx-auto flex w-full max-w-md flex-col gap-4 pb-4">
            {games.map((game) => (
              <li key={game.id}>
                <button
                  type="button"
                  className="flex h-16 w-full items-center overflow-hidden rounded-2xl border border-slate-700 bg-slate-800/80 text-left transition hover:border-slate-500 hover:bg-slate-800 active:bg-slate-900"
                >
                  <div className="flex h-full w-1/5 shrink-0 items-center justify-center px-2">
                    <img
                      src={game.icon}
                      alt=""
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <span className="w-4/5 truncate px-4 text-lg font-semibold text-white">
                    {game.name}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
