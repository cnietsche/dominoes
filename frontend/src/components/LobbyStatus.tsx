interface LobbyConnectionInfoProps {
  connected: boolean;
  userCount: number;
  size: number;
}

interface LobbyGameInfoProps {
  joined: boolean;
  inProgress: boolean;
  busy: boolean;
  onEndGame: () => void;
}

export function LobbyConnectionInfo({
  connected,
  userCount,
  size,
}: LobbyConnectionInfoProps) {
  return (
    <div className="flex shrink-0 flex-col items-end gap-1.5">
      <span
        className={`inline-flex h-8 items-center gap-2 whitespace-nowrap rounded-full px-3 text-xs ${
          connected ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
        }`}
      >
        <span className={`h-2 w-2 shrink-0 rounded-full ${connected ? 'bg-emerald-400' : 'bg-red-400'}`} />
        {connected ? 'Conectado' : 'Desconectado'}
      </span>

      <span className="inline-flex h-8 items-center whitespace-nowrap rounded-full bg-slate-800 px-3 text-xs tabular-nums">
        {userCount} / {size} jogadores
      </span>
    </div>
  );
}

export function LobbyGameInfo({
  joined,
  inProgress,
  busy,
  onEndGame,
}: LobbyGameInfoProps) {
  if (!joined) {
    return null;
  }

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      <span className="inline-flex h-8 items-center whitespace-nowrap rounded-full bg-blue-500/20 px-3 text-xs text-blue-300">
        {inProgress ? 'Partida em andamento' : 'No lobby'}
      </span>

      {inProgress && (
        <button
          type="button"
          onClick={onEndGame}
          disabled={busy}
          className="inline-flex h-8 shrink-0 items-center whitespace-nowrap rounded-lg bg-red-600 px-3 text-xs font-medium text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Finalizar partida
        </button>
      )}
    </div>
  );
}
