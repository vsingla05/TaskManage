import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import {
  addMembers,
  deleteProject,
  getProject,
  removeMember,
} from '../api/projects.js';
import { createTask, deleteTask, listTasks, updateTask } from '../api/tasks.js';
import { searchUsers } from '../api/users.js';
import TaskKanban from '../components/TaskKanban.jsx';

function ownerId(project) {
  const c = project?.createdBy;
  if (!c) return null;
  return typeof c === 'object' ? String(c._id || c.id) : String(c);
}

export default function ProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [taskLoading, setTaskLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [view, setView] = useState('board'); // board | table

  const [memberQuery, setMemberQuery] = useState('');
  const [searchHits, setSearchHits] = useState([]);

  const [taskModal, setTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    assignedTo: '',
  });
  const [savingTask, setSavingTask] = useState(false);

  const uid = user?.id ? String(user.id) : null;
  const pid = ownerId(project);
  const isOwner = pid && uid && pid === uid;

  const loadProject = useCallback(async () => {
    try {
      const res = await getProject(projectId);
      setProject(res.project);
    } catch {
      toast.error('Project not found');
      navigate('/projects');
    }
  }, [projectId, navigate]);

  const loadTasks = useCallback(async () => {
    setTaskLoading(true);
    try {
      const params = {
        page: 1,
        limit: 100,
        search: search.trim() || undefined,
      };
      if (statusFilter && view === 'table') params.status = statusFilter;
      const res = await listTasks(projectId, params);
      setTasks(res.tasks);
      setPagination(res.pagination || { page: 1, pages: 1, total: res.tasks.length });
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setTaskLoading(false);
    }
  }, [projectId, search, statusFilter, view]);

  useEffect(() => {
    setLoading(true);
    loadProject().finally(() => setLoading(false));
  }, [loadProject]);

  useEffect(() => {
    if (!projectId) return;
    const t = setTimeout(() => {
      loadTasks();
    }, 300);
    return () => clearTimeout(t);
  }, [loadTasks, projectId]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!isAdmin || memberQuery.trim().length < 2) {
        setSearchHits([]);
        return;
      }
      try {
        const res = await searchUsers(memberQuery.trim());
        if (!cancelled) setSearchHits(res.users || []);
      } catch {
        if (!cancelled) setSearchHits([]);
      }
    }
    const t = setTimeout(run, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [memberQuery, isAdmin]);

  const memberIds = useMemo(() => new Set((project?.members || []).map((m) => String(m._id || m))), [project]);

  async function inviteUser(u) {
    const id = String(u.id);
    if (memberIds.has(id)) {
      toast.error('Already a member');
      return;
    }
    try {
      const res = await addMembers(projectId, [id]);
      setProject(res.project);
      setMemberQuery('');
      setSearchHits([]);
      toast.success(`${u.name} added`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not add member');
    }
  }

  async function onRemoveMember(userId) {
    if (!window.confirm('Remove this member? Their tasks will go to the project owner.')) return;
    try {
      const res = await removeMember(projectId, userId);
      setProject(res.project);
      loadTasks();
      toast.success('Member removed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Remove failed');
    }
  }

  async function onDeleteProject() {
    if (!window.confirm('Delete this project and all tasks? This cannot be undone.')) return;
    try {
      await deleteProject(projectId);
      toast.success('Project deleted');
      navigate('/projects');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
}

  async function onCreateTask(ev) {
    ev.preventDefault();
    if (!taskForm.title.trim() || !taskForm.dueDate || !taskForm.assignedTo) {
      toast.error('Fill title, due date, and assignee');
      return;
    }
    setSavingTask(true);
    try {
      await createTask(projectId, {
        title: taskForm.title.trim(),
        description: taskForm.description.trim(),
        dueDate: new Date(taskForm.dueDate).toISOString(),
        assignedTo: taskForm.assignedTo,
      });
      toast.success('Task created');
      setTaskForm({ title: '', description: '', dueDate: '', assignedTo: '' });
      setTaskModal(false);
      loadTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create task');
    } finally {
      setSavingTask(false);
    }
  }

  async function onDeleteTask(taskId) {
    if (!window.confirm('Delete this task?')) return;
    try {
      await deleteTask(projectId, taskId);
      setTasks((prev) => prev.filter((t) => String(t._id) !== String(taskId)));
      toast.success('Task deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  }

  function canDragTask(task) {
    if (isAdmin) return true;
    const aid = task.assignedTo?._id || task.assignedTo;
    return aid && String(aid) === uid;
  }

  async function handleStatusChange(taskId, newStatus) {
    const prev = tasks;
    setTasks((t) =>
      t.map((x) => (String(x._id) === String(taskId) ? { ...x, status: newStatus } : x))
    );
    try {
      await updateTask(projectId, taskId, { status: newStatus });
    } catch (err) {
      setTasks(prev);
      toast.error(err.response?.data?.message || 'Could not update status');
    }
  }

  const displayTasks = useMemo(() => {
    if (view === 'board') return tasks;
    if (statusFilter) return tasks.filter((t) => t.status === statusFilter);
    return tasks;
  }, [tasks, view, statusFilter]);

  if (loading || !project) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-20 md:pb-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <Link
            to="/projects"
            className="text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            ← Projects
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{project.name}</h1>
          <p className="mt-1 max-w-2xl text-slate-600 dark:text-slate-400">
            {project.description || 'No description'}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Owner: {project.createdBy?.name || '—'} · {pagination.total} tasks loaded
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAdmin && (
            <button
              type="button"
              onClick={() => setTaskModal(true)}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              New task
            </button>
          )}
          {isAdmin && isOwner && (
            <button
              type="button"
              onClick={onDeleteProject}
              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40"
            >
              Delete project
            </button>
          )}
        </div>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Members</h2>
        {isAdmin ? (
          <>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Search by name or email to invite users (admin only).
            </p>
            <input
              className="mt-3 w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              placeholder="Search users…"
              value={memberQuery}
              onChange={(e) => setMemberQuery(e.target.value)}
            />
            {searchHits.length > 0 && (
              <ul className="mt-2 max-w-md divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-700">
                {searchHits.map((u) => (
                  <li
                    key={u.id}
                    className="flex items-center justify-between bg-white px-3 py-2 dark:bg-slate-900"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{u.name}</p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => inviteUser(u)}
                      className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                    >
                      Add
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            People on this project. Contact an admin to be added or removed.
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {(project.members || []).map((m) => (
            <span
              key={m._id}
              className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-100"
            >
              {m.name}
              {isAdmin && String(m._id) !== pid && (
                <button
                  type="button"
                  className="text-red-600 hover:underline"
                  onClick={() => onRemoveMember(m._id)}
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setView('board')}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                view === 'board'
                  ? 'bg-brand-600 text-white'
                  : 'border border-slate-200 dark:border-slate-700'
              }`}
            >
              Board
            </button>
            <button
              type="button"
              onClick={() => setView('table')}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                view === 'table'
                  ? 'bg-brand-600 text-white'
                  : 'border border-slate-200 dark:border-slate-700'
              }`}
            >
              Table
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              placeholder="Search tasks…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="todo">To do</option>
              <option value="in-progress">In progress</option>
              <option value="done">Done</option>
            </select>
          </div>
        </div>

        {taskLoading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
          </div>
        ) : view === 'board' ? (
          <TaskKanban
            tasks={displayTasks}
            onStatusChange={handleStatusChange}
            canDragTask={canDragTask}
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-2">Title</th>
                  <th className="px-4 py-2">Assignee</th>
                  <th className="px-4 py-2">Due</th>
                  <th className="px-4 py-2">Status</th>
                  {isAdmin && <th className="px-4 py-2" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {displayTasks.length === 0 && (
                  <tr>
                    <td
                      colSpan={isAdmin ? 5 : 4}
                      className="px-4 py-8 text-center text-slate-500"
                    >
                      No tasks match your filters.
                    </td>
                  </tr>
                )}
                {displayTasks.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 dark:text-white">{t.title}</div>
                      {t.overdue && (
                        <span className="mt-1 inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800 dark:bg-red-900/50 dark:text-red-100">
                          Overdue
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {t.assignedTo?.name || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        value={t.status}
                        disabled={!canDragTask(t)}
                        onChange={(e) => handleStatusChange(t._id, e.target.value)}
                      >
                        <option value="todo">To do</option>
                        <option value="in-progress">In progress</option>
                        <option value="done">Done</option>
                      </select>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          className="text-xs font-semibold text-red-600 hover:underline"
                          onClick={() => onDeleteTask(t._id)}
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination.pages > 1 && (
          <p className="text-xs text-slate-500">
            Page {pagination.page} of {pagination.pages}. Increase limit in API for more tasks.
          </p>
        )}
      </section>

      {taskModal && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">New task</h3>
            <form onSubmit={onCreateTask} className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Title</label>
                <input
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Description</label>
                <textarea
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                  rows={3}
                  value={taskForm.description}
                  onChange={(e) => setTaskForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Due date</label>
                  <input
                    type="date"
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm((f) => ({ ...f, dueDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Assignee</label>
                  <select
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    value={taskForm.assignedTo}
                    onChange={(e) => setTaskForm((f) => ({ ...f, assignedTo: e.target.value }))}
                  >
                    <option value="">Select member</option>
                    {(project.members || []).map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.name} ({m.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTaskModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm dark:border-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTask}
                  className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {savingTask ? 'Saving…' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
