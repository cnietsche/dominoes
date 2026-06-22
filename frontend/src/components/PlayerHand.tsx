interface PlayerHandProps {
  pieces: string[];
}

export function PlayerHand({ pieces }: PlayerHandProps) {
  return (
    <div className="flex min-h-[100px] w-full items-center justify-center gap-2 overflow-x-auto border-t border-slate-700 bg-slate-900/80 px-6 py-4">
      {pieces.map((piece) => (
        <img
          key={piece}
          src={`/dominoes/${piece}.png`}
          alt={`Peça ${piece}`}
          width={44}
          height={88}
          className="h-[88px] w-[44px] shrink-0"
        />
      ))}
    </div>
  );
}
