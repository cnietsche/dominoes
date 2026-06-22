interface UserCardProps {
  nickname: string;
  isCurrentUser: boolean;
}

export function UserCard({ nickname, isCurrentUser }: UserCardProps) {
  return (
    <div
      className={`min-w-[140px] rounded-xl border bg-slate-800 px-4 py-3 shadow-md ${
        isCurrentUser
          ? 'border-blue-400 ring-2 ring-blue-500'
          : 'border-slate-600'
      }`}
    >
      <p className="text-xs uppercase tracking-wide text-slate-400">Jogador</p>
      <p className="truncate text-lg font-semibold text-white">{nickname}</p>
      {isCurrentUser && (
        <p className="mt-1 text-xs text-blue-300">Você</p>
      )}
    </div>
  );
}
