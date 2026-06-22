interface LobbyStatusProps {
  userCount: number;
  size: number;
  connected: boolean;
  joined: boolean;
}

export function LobbyStatus({ userCount, size, connected, joined }: LobbyStatusProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
      <span
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 ${
          connected ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
        }`}
      >
        <span className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-400' : 'bg-red-400'}`} />
        {connected ? 'Conectado' : 'Desconectado'}
      </span>
      <span className="rounded-full bg-slate-800 px-3 py-1">
        Jogadores: {userCount} / {size}
      </span>
      {joined && (
        <span className="rounded-full bg-blue-500/20 px-3 py-1 text-blue-300">
          Você está no lobby
        </span>
      )}
    </div>
  );
}
