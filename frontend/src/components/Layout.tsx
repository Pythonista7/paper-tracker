import { NavLink, Outlet } from 'react-router-dom';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-app text-white">
      <header className="sticky top-0 z-30 border-b border-white/5 bg-surface-900/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm text-white/60">PaperTracker</p>
            <h1 className="text-xl font-semibold">Research cockpit</h1>
          </div>
          <nav className="flex items-center gap-2 text-sm">
            <NavLink className={({ isActive }) => navClass(isActive)} to="/dashboard">
              Dashboard
            </NavLink>
            <NavLink className={({ isActive }) => navClass(isActive)} to="/read">
              Reader
            </NavLink>
            <a
              href="https://github.com/"
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-wide text-white/70 hover:text-white"
            >
              Share
            </a>
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
