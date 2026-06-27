import { UserCard } from './UserCard';

interface LobbyGridProps {
  users: { id: string; nickname: string }[];
  myUserId: string | null;
  size: number;
}

export function LobbyGrid({ users, myUserId, size }: LobbyGridProps) {
  return (
    <div className="w-full min-w-0">
      {users.length === 0 ? (
        <p className="text-sm text-slate-400">No players in the lobby yet.</p>
      ) : (
        <div
          className="grid w-full gap-1.5 sm:gap-2"
          style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
        >
          {users.map((user) => (
            <UserCard
              key={user.id}
              nickname={user.nickname}
              isCurrentUser={user.id === myUserId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
