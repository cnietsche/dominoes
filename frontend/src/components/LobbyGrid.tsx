import { UserCard } from './UserCard';

interface LobbyGridProps {
  users: { id: string; nickname: string }[];
  myUserId: string | null;
}

export function LobbyGrid({ users, myUserId }: LobbyGridProps) {
  if (users.length === 0) {
    return (
      <p className="text-sm text-slate-400">Nenhum jogador no lobby ainda.</p>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {users.map((user) => (
        <UserCard
          key={user.id}
          nickname={user.nickname}
          isCurrentUser={user.id === myUserId}
        />
      ))}
    </div>
  );
}
