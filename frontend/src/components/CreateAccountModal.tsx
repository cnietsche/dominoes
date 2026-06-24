import { useState, type FormEvent } from 'react';

interface CreateAccountModalProps {
  onCreate: (user: string, name: string, password: string) => Promise<void>;
  onClose: () => void;
  busy: boolean;
}

export function CreateAccountModal({ onCreate, onClose, busy }: CreateAccountModalProps) {
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const user = String(formData.get('user') ?? '').trim();
    const name = String(formData.get('name') ?? '').trim();
    const password = String(formData.get('password') ?? '');

    if (!user || !name || !password) {
      return;
    }

    try {
      await onCreate(user, name, password);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create account';
      setError(message);
    }
  };

  return (
    <div
      className="safe-area-x safe-area-bottom fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-account-title"
    >
      <div className="w-full max-w-sm rounded-xl border border-slate-600 bg-slate-900 p-5 shadow-2xl sm:p-6">
        <h2 id="create-account-title" className="mb-4 text-xl font-bold text-white sm:text-2xl">
          New account
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-left">
            <span className="text-sm font-medium text-slate-300">User</span>
            <input
              name="user"
              type="text"
              required
              maxLength={64}
              autoComplete="username"
              disabled={busy}
              className="min-h-12 w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-base text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50"
            />
          </label>

          <label className="flex flex-col gap-2 text-left">
            <span className="text-sm font-medium text-slate-300">Nickname</span>
            <input
              name="name"
              type="text"
              required
              maxLength={32}
              autoComplete="nickname"
              disabled={busy}
              className="min-h-12 w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-base text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50"
            />
          </label>

          <label className="flex flex-col gap-2 text-left">
            <span className="text-sm font-medium text-slate-300">Password</span>
            <input
              name="password"
              type="password"
              required
              autoComplete="new-password"
              disabled={busy}
              className="min-h-12 w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-base text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50"
            />
          </label>

          {error && (
            <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2.5 text-sm text-red-300">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="min-h-12 flex-1 rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-base font-semibold text-white transition hover:bg-slate-700 active:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="min-h-12 flex-1 rounded-xl bg-blue-600 px-4 py-3 text-base font-semibold text-white transition hover:bg-blue-500 active:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
