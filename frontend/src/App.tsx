import { useCallback, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { GameLibraryPage } from './pages/GameLibraryPage';
import { GameRoute } from './pages/GameRoute';
import { LoginPage } from './pages/LoginPage';

function App() {
  const {
    player,
    token,
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

  if (!isAuthenticated || !player || !token) {
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

  return (
    <Routes>
      <Route
        path="/"
        element={
          <GameLibraryPage nickname={player.name} token={token} onLogoff={logout} />
        }
      />
      <Route path="/games/:gameId" element={<GameRoute player={player} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
