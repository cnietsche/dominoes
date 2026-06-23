import { UserCard } from './UserCard';
import { BoneyardIndicator } from './BoneyardIndicator';
import type { TablePiece } from '../types/domino';
import { hasPlayablePiece } from '../utils/dominoRules';

interface LobbyGridProps {
  users: { id: string; nickname: string; handCount?: number | null }[];
  myUserId: string | null;
  currentPlayerId: string | null;
  inProgress: boolean;
  boneyardCount: number;
  hand: string[];
  table: TablePiece[];
  drawnThisTurn: boolean;
  busy: boolean;
  onDrawFromBoneyard: () => void;
}

export function LobbyGrid({
  users,
  myUserId,
  currentPlayerId,
  inProgress,
  boneyardCount,
  hand,
  table,
  drawnThisTurn,
  busy,
  onDrawFromBoneyard,
}: LobbyGridProps) {
  const isMyTurn = myUserId !== null && myUserId === currentPlayerId;
  const canPlay = hasPlayablePiece(hand, table);
  const canDraw =
    isMyTurn &&
    boneyardCount > 0 &&
    !drawnThisTurn &&
    !canPlay &&
    !busy;

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
      {inProgress && (
        <div className="shrink-0 self-start">
          <BoneyardIndicator
            count={boneyardCount}
            disabled={!canDraw}
            onDraw={onDrawFromBoneyard}
          />
        </div>
      )}
    </div>
  );
}
