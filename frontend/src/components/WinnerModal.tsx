interface WinnerModalProps {
  message: string;
  onDismiss: () => void;
}

export function WinnerModal({ message, onDismiss }: WinnerModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="result-title"
    >
      <div className="w-full max-w-sm rounded-xl border border-slate-600 bg-slate-900 p-6 text-center shadow-2xl">
        <h2
          id="result-title"
          className="text-2xl font-bold text-white"
        >
          {message}
        </h2>
        <button
          type="button"
          onClick={onDismiss}
          className="mt-6 w-full rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900"
        >
          Ok
        </button>
      </div>
    </div>
  );
}
