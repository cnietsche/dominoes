interface GameLibraryPageProps {
  nickname: string;
  onLogoff: () => void;
}

export function GameLibraryPage({ nickname, onLogoff }: GameLibraryPageProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="safe-area-x safe-area-top relative h-[100px] shrink-0 border-b border-slate-700">
        <div className="flex h-full flex-col justify-center pr-28">
          <h1 className="text-xl font-bold text-white sm:text-2xl">Game library</h1>
          <span className="mt-1 inline-flex w-fit rounded-full border border-slate-600 bg-slate-800 px-3 py-1 text-sm text-slate-300">
            {nickname}
          </span>
        </div>
        <button
          type="button"
          onClick={onLogoff}
          className="absolute right-4 top-1/2 min-h-11 -translate-y-1/2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 active:bg-red-700 sm:right-6 sm:min-h-12 sm:px-5 sm:text-base"
        >
          Logoff
        </button>
      </header>

      <main className="safe-area-x safe-area-bottom flex-1" />
    </div>
  );
}
