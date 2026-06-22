import type { FormEvent } from 'react';

interface NicknameFormProps {
  onSubmit: (nickname: string) => void;
  disabled: boolean;
  error: string | null;
}

export function NicknameForm({ onSubmit, disabled, error }: NicknameFormProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nickname = String(formData.get('nickname') ?? '').trim();
    if (nickname) {
      onSubmit(nickname);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-4">
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-slate-300">Nickname</span>
        <input
          name="nickname"
          type="text"
          required
          maxLength={32}
          disabled={disabled}
          placeholder="Digite seu nickname"
          className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50"
        />
      </label>
      {error && (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={disabled}
        className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {disabled ? 'Entrando...' : 'Entrar no lobby'}
      </button>
    </form>
  );
}
