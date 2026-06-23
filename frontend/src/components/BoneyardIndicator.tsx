import { BoneyardIcon } from './BoneyardIcon';

interface BoneyardIndicatorProps {
  count: number;
}

export function BoneyardIndicator({ count }: BoneyardIndicatorProps) {
  return (
    <div
      className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-600 bg-slate-800 px-3 py-2"
      title="Peças no monte"
      aria-label={`Peças no monte: ${count}`}
    >
      <BoneyardIcon className="h-10 w-10" />
      <span className="min-w-[2ch] text-2xl font-bold tabular-nums text-white">{count}</span>
    </div>
  );
}
