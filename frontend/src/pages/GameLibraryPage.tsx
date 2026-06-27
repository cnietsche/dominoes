import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as gameApi from '../api/gameApi';
import { usePresence } from '../context/PresenceContext';
import type { GameDto } from '../types/game';

interface GameLibraryPageProps {
  nickname: string;
  token: string;
  onLogoff: () => void;
}

export function GameLibraryPage({ nickname, token, onLogoff }: GameLibraryPageProps) {
  const navigate = useNavigate();
  const [games, setGames] = useState<GameDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { libraryCount, gameLobbies, total, connected } = usePresence();

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
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <img
          src="/background/gear.png"
          alt=""
          className="gear-bg-spin gear-bg-size absolute top-[30%] left-0 opacity-[0.5]"
        />
        <img
          src="/background/gear.png"
          alt=""
          className="gear-bg-spin-reverse-left gear-bg-size-sm absolute top-[70%] left-0 opacity-[0.5]"
        />
        <img
          src="/background/gear.png"
          alt=""
          className="gear-bg-spin-right gear-bg-size absolute top-[70%] right-0 opacity-[0.5]"
        />
        <img
          src="/background/gear.png"
          alt=""
          className="gear-bg-spin-reverse gear-bg-size-sm absolute top-[30%] right-0 opacity-[0.5]"
        />
      </div>

      <header className="safe-area-x safe-area-top relative backdrop-blur z-10 shrink-0 border-b border-slate-700 py-4">
        <div className="flex flex-col justify-center pr-28">
          <h1 className="text-xl font-bold text-white sm:text-2xl">Game library</h1>
          <div className="mt-1 flex flex-wrap gap-2">
            <span className="inline-flex w-fit rounded-full border border-slate-600 bg-slate-800 px-3 py-1 text-sm text-slate-300">
              {nickname}
            </span>
            {connected && (
              <>
                <span className="inline-flex w-fit rounded-full bg-slate-800 px-3 py-1 text-sm tabular-nums text-slate-300">
                  {libraryCount} available
                </span>
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-sm tabular-nums text-emerald-300">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
                  {total} online
                </span>
              </>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onLogoff}
          className="absolute right-4 top-1/2 min-h-11 -translate-y-1/2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 active:bg-red-700 sm:right-6 sm:min-h-12 sm:px-5 sm:text-base"
        >
          Logoff
        </button>
      </header>

      <main className="safe-area-x safe-area-bottom relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto pt-4">
        {loading && <p className="text-slate-400">Loading games...</p>}

        {!loading && error && <p className="text-red-400">{error}</p>}

        {!loading && !error && (
          <ul className="mx-auto flex w-full max-w-md flex-col gap-4 pb-4">
            {games.map((game) => {
              const lobby = gameLobbies[game.id];
              const lobbyCount = lobby?.count ?? 0;
              const lobbyMax = lobby?.max ?? 0;
              const lobbyMin = lobby?.min ?? 0;

              return (
                <li key={game.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/games/${game.id}`)}
                    className="flex h-16 w-full items-center overflow-hidden rounded-2xl border border-white/10 bg-slate-900/25 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xs transition hover:border-white/20 hover:bg-slate-900/35 active:bg-slate-900/45"
                  >
                    <div className="flex h-full w-1/5 shrink-0 items-center justify-center px-2">
                      <img
                        src={game.icon}
                        alt=""
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <span className="min-w-0 flex-1 truncate px-4 text-lg font-semibold text-white">
                      {game.name}
                    </span>
                    <div className="mr-4 flex shrink-0 items-center gap-1.5">
                      <span className="rounded-full border border-white/5 bg-slate-900/40 px-2.5 py-0.5 text-xs tabular-nums text-slate-300 backdrop-blur-sm">
                        min: {lobbyMin}
                      </span>
                      <span className="rounded-full border border-white/5 bg-slate-900/40 px-2.5 py-0.5 text-xs tabular-nums text-slate-300 backdrop-blur-sm">
                        Lobby {lobbyCount}/{lobbyMax}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
