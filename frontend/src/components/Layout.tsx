import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { LogOut, LogIn } from 'lucide-react';

export function AppLayout() {
  const { isAuthenticated, logout, email } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-app text-white">
      <header className="sticky top-0 z-30 border-b border-white/5 bg-surface-900/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold">PaperTracker</h1>
            <p className="text-sm text-white/60">Research cockpit </p>
          </div>
          <nav className="flex items-center gap-2 text-sm">
            <NavLink className={({ isActive }) => navClass(isActive)} to="/dashboard">
              Dashboard
            </NavLink>
            <NavLink className={({ isActive }) => navClass(isActive)} to="/read">
              Reader
            </NavLink>
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/50">{email}</span>
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="h-7 gap-1 px-2 text-xs"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Logout
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                onClick={() => navigate('/login')}
                className="h-7 gap-1 px-2 text-xs"
              >
                <LogIn className="h-3.5 w-3.5" />
                Login
              </Button>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}

function navClass(isActive: boolean) {
  return `rounded-full px-3 py-1 font-medium ${isActive ? 'bg-accent/20 text-accent' : 'text-white/60 hover:text-white'}`;
}
