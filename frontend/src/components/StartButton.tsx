interface StartButtonProps {
  disabled: boolean;
  onClick: () => void;
}

export function StartButton({ disabled, onClick }: StartButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-28 w-28 items-center justify-center rounded-full bg-emerald-600 text-lg font-semibold text-white shadow-lg transition hover:bg-emerald-500 active:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 sm:h-32 sm:w-32"
    >
      Iniciar
    </button>
  );
}
