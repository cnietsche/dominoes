import { UserCard } from './UserCard';

interface LobbyGridProps {
  users: { id: string; nickname: string; handCount?: number | null }[];
  myUserId: string | null;
  currentPlayerId: string | null;
  inProgress: boolean;
}

export function LobbyGrid({
  users,
  myUserId,
  currentPlayerId,
  inProgress,
}: LobbyGridProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="min-w-0 flex-1">
        {users.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhum jogador no lobby ainda.</p>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2">
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
    </div>
  );
}
