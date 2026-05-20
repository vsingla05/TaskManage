import Task from '../models/Task.js';
import Project from '../models/Project.js';
import { formatTask } from './taskController.js';

/**
 * Aggregate task stats for dashboard cards.
 * Admin: all tasks in projects they belong to.
 * Member: only tasks assigned to them.
 */
export async function getDashboard(req, res) {
  try {
    const uid = req.user._id;
    let projectFilter = {};
    if (req.user.role === 'admin') {
      const projects = await Project.find({
        $or: [{ members: uid }, { createdBy: uid }],
      }).select('_id');
      projectFilter = { project: { $in: projects.map((p) => p._id) } };
    } else {
      projectFilter = { assignedTo: uid };
    }

    const tasks = await Task.find(projectFilter)
      .populate('project', 'name')
      .populate('assignedTo', 'name email')
      .sort({ dueDate: 1 })
      .limit(200);

    const now = new Date();
    let total = 0;
    let completed = 0;
    let pending = 0;
    let overdue = 0;

    const enriched = tasks.map((t) => formatTask(t));
    for (const t of enriched) {
      total += 1;
      if (t.status === 'done') completed += 1;
      else {
        pending += 1;
        if (t.overdue) overdue += 1;
      }
    }

    const recent = enriched.slice(0, 12);

    res.json({
      stats: { total, completed, pending, overdue },
      recentTasks: recent,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load dashboard' });
  }
}
