interface LobbyStatusProps {
  userCount: number;
  size: number;
  connected: boolean;
  joined: boolean;
  inProgress: boolean;
  busy: boolean;
  onEndGame: () => void;
}

const SLOT_END_GAME = 'w-[148px]';
const SLOT_CONNECTED = 'w-[120px]';
const SLOT_PLAYERS = 'w-[132px]';
const SLOT_STATUS = 'w-[176px]';

export function LobbyStatus({
  userCount,
  size,
  connected,
  joined,
  inProgress,
  busy,
  onEndGame,
}: LobbyStatusProps) {
  return (
    <div className="flex items-center gap-3 text-sm text-slate-300">
      {joined && (
        <div className={`flex shrink-0 items-center justify-center ${SLOT_END_GAME}`}>
          {inProgress ? (
            <button
              type="button"
              onClick={onEndGame}
              disabled={busy}
              className="w-full rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Finalizar partida
            </button>
          ) : (
            <span className="invisible w-full rounded-lg px-3 py-1.5 text-sm font-medium" aria-hidden>
              Finalizar partida
            </span>
          )}
        </div>
      )}

      <span
        className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-full px-3 py-1 ${SLOT_CONNECTED} ${
          connected ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
        }`}
      >
        <span className={`h-2 w-2 shrink-0 rounded-full ${connected ? 'bg-emerald-400' : 'bg-red-400'}`} />
        <span className="truncate">{connected ? 'Conectado' : 'Desconectado'}</span>
      </span>

      <span className={`shrink-0 truncate rounded-full bg-slate-800 px-3 py-1 text-center ${SLOT_PLAYERS}`}>
        Jogadores: {userCount} / {size}
      </span>

      {joined ? (
        <span className={`shrink-0 truncate rounded-full bg-blue-500/20 px-3 py-1 text-center text-blue-300 ${SLOT_STATUS}`}>
          {inProgress ? 'Partida em andamento' : 'Você está no lobby'}
        </span>
      ) : (
        <span className={`invisible shrink-0 truncate px-3 py-1 text-center ${SLOT_STATUS}`} aria-hidden>
          Partida em andamento
        </span>
      )}
    </div>
  );
}
