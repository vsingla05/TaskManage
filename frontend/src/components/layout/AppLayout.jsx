import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';

const linkBase =
  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-slate-100 dark:hover:bg-slate-800';
const active =
  'bg-brand-600 text-white shadow-sm hover:bg-brand-700 dark:bg-brand-600 dark:hover:bg-brand-700 dark:text-white';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-4 dark:border-slate-800">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
            TM
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Team tasks
            </p>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Manager</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `${linkBase} ${isActive ? active : 'text-slate-700 dark:text-slate-200'}`}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/projects"
            className={({ isActive }) => `${linkBase} ${isActive ? active : 'text-slate-700 dark:text-slate-200'}`}
          >
            Projects
          </NavLink>
        </nav>
        <div className="border-t border-slate-200 p-3 dark:border-slate-800">
          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{user.name}</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
            <span className="mt-2 inline-flex rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
              {user.role}
            </span>
          </div>
          <button
            type="button"
            onClick={logout}
            className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Log out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 md:hidden">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-xs font-bold text-white">
              TM
            </span>
            <span className="font-semibold text-slate-900 dark:text-white">Tasks</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggle}
              className="rounded-lg border border-slate-200 px-2 py-1 text-xs dark:border-slate-700"
              aria-label="Toggle dark mode"
            >
              {dark ? 'Light' : 'Dark'}
            </button>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg bg-slate-900 px-2 py-1 text-xs text-white dark:bg-white dark:text-slate-900"
            >
              Out
            </button>
          </div>
        </header>

        <header className="hidden h-14 items-center justify-end border-b border-slate-200 bg-white px-6 dark:border-slate-800 dark:bg-slate-900 md:flex">
          <button
            type="button"
            onClick={toggle}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {dark ? 'Light mode' : 'Dark mode'}
          </button>
        </header>

        <main className="flex-1 overflow-auto p-4 pb-20 md:pb-8 md:p-8">
          <Outlet />
        </main>

        <nav className="fixed bottom-0 left-0 right-0 flex items-center justify-around border-t border-slate-200 bg-white py-2 dark:border-slate-800 dark:bg-slate-900 md:hidden">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `text-xs font-medium ${isActive ? 'text-brand-600' : 'text-slate-500'}`
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/projects"
            className={({ isActive }) =>
              `text-xs font-medium ${isActive ? 'text-brand-600' : 'text-slate-500'}`
            }
          >
            Projects
          </NavLink>
        </nav>
      </div>
    </div>
  );
}
