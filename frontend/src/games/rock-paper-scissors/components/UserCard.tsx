interface UserCardProps {
  nickname: string;
  isCurrentUser: boolean;
}

export function UserCard({ nickname, isCurrentUser }: UserCardProps) {
  const borderClass = isCurrentUser
    ? 'border-blue-400 ring-1 ring-blue-500 sm:ring-2'
    : 'border-slate-600';

  return (
    <div
      className={`min-w-0 rounded-lg border bg-slate-800 px-1.5 py-1.5 shadow-md sm:rounded-xl sm:px-2.5 sm:py-2 ${borderClass}`}
    >
      <p className="truncate text-xs font-semibold text-white sm:text-sm">{nickname}</p>
      {isCurrentUser && (
        <p className="mt-0.5 truncate text-[0.6rem] text-blue-300 sm:text-xs">You</p>
      )}
    </div>
  );
}
