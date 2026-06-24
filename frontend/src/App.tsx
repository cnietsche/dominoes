import { useCallback, useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { GameLibraryPage } from './pages/GameLibraryPage';
import { LoginPage } from './pages/LoginPage';

function App() {
  const {
    player,
    loading,
    error,
    isAuthenticated,
    register,
    login,
    logout,
    clearError,
    handleError,
  } = useAuth();

  const [busy, setBusy] = useState(false);

  const handleLogin = useCallback(
    async (user: string, password: string) => {
      setBusy(true);
      clearError();
      try {
        await login({ user, password });
      } catch (err) {
        handleError(err);
      } finally {
        setBusy(false);
      }
    },
    [login, clearError, handleError],
  );

  const handleRegister = useCallback(
    async (user: string, name: string, password: string) => {
      setBusy(true);
      try {
        await register({ user, name, password });
      } finally {
        setBusy(false);
      }
    },
    [register],
  );

  if (loading) {
    return (
      <div className="safe-area-x safe-area-top safe-area-bottom flex min-h-dvh items-center justify-center">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  if (isAuthenticated && player) {
    return <GameLibraryPage nickname={player.name} onLogoff={logout} />;
  }

  return (
    <LoginPage
      onLogin={handleLogin}
      onRegister={handleRegister}
      error={error}
      onClearError={clearError}
      busy={busy}
    />
  );
}

export default App;
