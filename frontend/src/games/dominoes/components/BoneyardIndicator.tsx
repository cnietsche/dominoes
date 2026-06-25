import { BoneyardIcon } from './BoneyardIcon';

interface BoneyardIndicatorProps {
  count: number;
  disabled: boolean;
  onDraw: () => void;
}

export function BoneyardIndicator({
  count,
  disabled,
  onDraw,
}: BoneyardIndicatorProps) {
  return (
    <button
      type="button"
      onClick={onDraw}
      disabled={disabled}
      className={[
        'flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 transition',
        disabled
          ? 'cursor-not-allowed opacity-50'
          : 'cursor-pointer hover:border-slate-500 hover:bg-slate-700',
      ].join(' ')}
      title={
        disabled
          ? count === 0
            ? 'Boneyard empty'
            : 'Unavailable (play a piece, draw only with no playable pieces, or already drew)'
          : 'Draw a piece from the boneyard'
      }
      aria-label={`Draw from boneyard. Pieces remaining: ${count}`}
    >
      <BoneyardIcon className="h-10 w-10" />
      <span className="min-w-[2ch] text-2xl font-bold tabular-nums text-white">
        {count}
      </span>
    </button>
  );
}
