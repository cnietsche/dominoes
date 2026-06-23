interface UserCardProps {
  nickname: string;
  isCurrentUser: boolean;
  isCurrentTurn: boolean;
  inProgress: boolean;
  handCount?: number | null;
}

export function UserCard({
  nickname,
  isCurrentUser,
  isCurrentTurn,
  inProgress,
  handCount,
}: UserCardProps) {
  const borderClass = isCurrentTurn
    ? 'border-orange-400 ring-2 ring-orange-500'
    : isCurrentUser
      ? 'border-blue-400 ring-2 ring-blue-500'
      : 'border-slate-600';

  return (
    <div
      className={`min-w-[140px] rounded-xl border bg-slate-800 px-4 py-3 shadow-md ${borderClass}`}
    >
      <p className="text-xs uppercase tracking-wide text-slate-400">
        Jogador
        {inProgress && handCount != null && (
          <span className="normal-case tabular-nums"> ({handCount})</span>
        )}
      </p>
      <p className="truncate text-lg font-semibold text-white">{nickname}</p>
      {isCurrentUser && (
        <p className="mt-1 text-xs text-blue-300">Você</p>
      )}
    </div>
  );
}
