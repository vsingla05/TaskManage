import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getDashboard } from '../api/dashboard.js';

function StatCard({ title, value, hint, tone = 'default' }) {
  const tones = {
    default: 'border-slate-200 dark:border-slate-700',
    success: 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-800 dark:bg-emerald-950/30',
    warn: 'border-amber-200 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/20',
    danger: 'border-red-200 bg-red-50/60 dark:border-red-900/50 dark:bg-red-950/20',
  };
  return (
    <div
      className={`rounded-xl border bg-white p-5 shadow-sm dark:bg-slate-900 ${tones[tone] || tones.default}`}
    >
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  );
}

function statusLabel(s) {
  if (s === 'in-progress') return 'In progress';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch(() => toast.error('Could not load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  const { stats, recentTasks } = data;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <p className="text-slate-600 dark:text-slate-400">Your tasks at a glance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total tasks" value={stats.total} />
        <StatCard title="Completed" value={stats.completed} tone="success" hint="Status = done" />
        <StatCard title="Pending" value={stats.pending} tone="warn" hint="Not done yet" />
        <StatCard
          title="Overdue"
          value={stats.overdue}
          tone="danger"
          hint="Due date passed & not done"
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent tasks</h2>
          <Link
            to="/projects"
            className="text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            View projects
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3">Title</th>
                <th className="px-5 py-3">Project</th>
                <th className="px-5 py-3">Assignee</th>
                <th className="px-5 py-3">Due</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {recentTasks.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                    No tasks yet. Open a project to get started.
                  </td>
                </tr>
              )}
              {recentTasks.map((t) => (
                <tr key={t._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      {t.title}
                      {t.overdue && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800 dark:bg-red-900/50 dark:text-red-200">
                          Overdue
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                    {t.project?.name || '—'}
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                    {t.assignedTo?.name || '—'}
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                    {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {statusLabel(t.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
