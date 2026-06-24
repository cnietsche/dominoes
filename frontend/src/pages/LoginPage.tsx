import { useState, type FormEvent } from 'react';
import { CreateAccountModal } from '../components/CreateAccountModal';

interface LoginPageProps {
  onLogin: (user: string, password: string) => Promise<void>;
  onRegister: (user: string, name: string, password: string) => Promise<void>;
  error: string | null;
  onClearError: () => void;
  busy: boolean;
}

export function LoginPage({
  onLogin,
  onRegister,
  error,
  onClearError,
  busy,
}: LoginPageProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onClearError();

    const formData = new FormData(event.currentTarget);
    const user = String(formData.get('user') ?? '').trim().toLowerCase();
    const password = String(formData.get('password') ?? '');

    if (user && password) {
      await onLogin(user, password);
    }
  };

  const handleCreate = async (user: string, name: string, password: string) => {
    await onRegister(user, name, password);
    setShowCreateModal(false);
  };

  return (
    <>
      <div className="safe-area-x safe-area-top safe-area-bottom flex min-h-dvh items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <h1 className="mb-6 text-center text-2xl font-bold text-white sm:text-3xl">
            Game Library
          </h1>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <label className="flex flex-col gap-2 text-left">
              <span className="text-sm font-medium text-slate-300">User</span>
              <input
                name="user"
                type="text"
                required
                maxLength={64}
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                disabled={busy}
                onChange={(event) => {
                  event.target.value = event.target.value.toLowerCase();
                }}
                className="min-h-12 w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-base lowercase text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50"
              />
            </label>

            <label className="flex flex-col gap-2 text-left">
              <span className="text-sm font-medium text-slate-300">Password</span>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
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
                type="submit"
                disabled={busy}
                className="min-h-12 flex-1 rounded-xl bg-blue-600 px-4 py-3 text-base font-semibold text-white transition hover:bg-blue-500 active:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? 'Signing in...' : 'Login'}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  onClearError();
                  setShowCreateModal(true);
                }}
                className="min-h-12 flex-1 rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-base font-semibold text-white transition hover:bg-slate-700 active:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                New account
              </button>
            </div>
          </form>
        </div>
      </div>

      {showCreateModal && (
        <CreateAccountModal
          onCreate={handleCreate}
          onClose={() => setShowCreateModal(false)}
          busy={busy}
        />
      )}
    </>
  );
}
