import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import { createProject, listProjects } from '../api/projects.js';

export default function Projects() {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', memberIds: '' });
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const res = await listProjects();
      setProjects(res.projects);
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreate(ev) {
    ev.preventDefault();
    if (!form.name.trim()) {
      toast.error('Project name required');
      return;
    }
    setSaving(true);
    try {
      const ids = form.memberIds
        .split(/[\s,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      await createProject({
        name: form.name.trim(),
        description: form.description.trim(),
        memberIds: ids,
      });
      toast.success('Project created');
      setForm({ name: '', description: '', memberIds: '' });
      setOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create project');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Projects</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Teams you belong to. Owners can invite more members on the project page.
          </p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            New project
          </button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {projects.length === 0 && (
          <p className="col-span-full rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500 dark:border-slate-700">
            No projects yet.
            {isAdmin ? ' Create one to start assigning tasks.' : ' Ask an admin to add you.'}
          </p>
        )}
        {projects.map((p) => (
          <Link
            key={p._id}
            to={`/projects/${p._id}`}
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-700"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-400">
                  {p.name}
                </h2>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
                  {p.description || 'No description'}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {p.members?.length || 0} members
              </span>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              Owner: {p.createdBy?.name || 'Unknown'}
            </p>
          </Link>
        ))}
      </div>

      {open && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">New project</h3>
            <form onSubmit={onCreate} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Name</label>
                <input
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Description</label>
                <textarea
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Member user IDs (optional, comma-separated Mongo IDs)
                </label>
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                  placeholder="64f... , 64a..."
                  value={form.memberIds}
                  onChange={(e) => setForm((f) => ({ ...f, memberIds: e.target.value }))}
                />
                <p className="mt-1 text-xs text-slate-500">
                  You are added automatically. On the project page, search users by email to invite.
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm dark:border-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
