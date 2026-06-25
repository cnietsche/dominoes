import { UserCard } from './UserCard';

interface LobbyGridProps {
  users: { id: string; nickname: string; handCount?: number | null }[];
  myUserId: string | null;
  currentPlayerId: string | null;
  inProgress: boolean;
  size: number;
}

export function LobbyGrid({
  users,
  myUserId,
  currentPlayerId,
  inProgress,
  size,
}: LobbyGridProps) {
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
              isCurrentTurn={inProgress && user.id === currentPlayerId}
              inProgress={inProgress}
              handCount={user.handCount}
            />
          ))}
        </div>
      )}
    </div>
  );
}
