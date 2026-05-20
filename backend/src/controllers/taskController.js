import Task from '../models/Task.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import { validationResult } from 'express-validator';

export function formatTask(doc) {
  const o = doc.toObject ? doc.toObject() : doc;
  const now = new Date();
  o.overdue = o.status !== 'done' && new Date(o.dueDate) < now;
  return o;
}

function validate(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    return true;
  }
  return false;
}

export async function listTasks(req, res) {
  try {
    const project = req.project;
    const { status, search, page = 1, limit = 50 } = req.query;
    const clauses = [{ project: project._id }];
    if (req.user.role !== 'admin') {
      clauses.push({ assignedTo: req.user._id });
    }
    if (status && ['todo', 'in-progress', 'done'].includes(status)) {
      clauses.push({ status });
    }
    if (search && String(search).trim()) {
      const term = new RegExp(String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      clauses.push({ $or: [{ title: term }, { description: term }] });
    }
    const q = clauses.length === 1 ? clauses[0] : { $and: clauses };
    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (p - 1) * l;
    const [tasks, total] = await Promise.all([
      Task.find(q)
        .populate('assignedTo', 'name email role')
        .populate('createdBy', 'name email role')
        .sort({ dueDate: 1, createdAt: -1 })
        .skip(skip)
        .limit(l),
      Task.countDocuments(q),
    ]);
    res.json({
      tasks: tasks.map(formatTask),
      pagination: { page: p, limit: l, total, pages: Math.ceil(total / l) || 1 },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to list tasks' });
  }
}

export async function createTask(req, res) {
  if (validate(req, res)) return;
  try {
    const project = req.project;
    const { title, description, dueDate, assignedTo, status } = req.body;
    const assignee = await User.findById(assignedTo);
    if (!assignee) {
      return res.status(400).json({ message: 'Assignee not found' });
    }
    if (!project.members.some((m) => m.equals(assignedTo))) {
      return res.status(400).json({ message: 'Assignee must be a project member' });
    }
    const task = await Task.create({
      title,
      description: description || '',
      dueDate,
      project: project._id,
      assignedTo,
      createdBy: req.user._id,
      status: status || 'todo',
    });
    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email role');
    res.status(201).json({ task: formatTask(populated) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create task' });
  }
}

export async function updateTask(req, res) {
  if (validate(req, res)) return;
  try {
    const { id } = req.params;
    const task = await Task.findById(id).populate('project');
    if (!task || !task.project._id.equals(req.project._id)) {
      return res.status(404).json({ message: 'Task not found' });
    }
    const isAdmin = req.user.role === 'admin';
    const isAssignee = task.assignedTo.equals(req.user._id);

    if (!isAdmin && !isAssignee) {
      return res.status(403).json({ message: 'Not allowed to update this task' });
    }

    const { title, description, dueDate, status, assignedTo } = req.body;

    if (isAdmin) {
      if (title !== undefined) task.title = title;
      if (description !== undefined) task.description = description;
      if (dueDate !== undefined) task.dueDate = dueDate;
      if (status !== undefined) task.status = status;
      if (assignedTo !== undefined) {
        const p = await Project.findById(task.project._id);
        const user = await User.findById(assignedTo);
        if (!user) return res.status(400).json({ message: 'Assignee not found' });
        if (!p.members.some((m) => m.equals(assignedTo))) {
          return res.status(400).json({ message: 'Assignee must be a project member' });
        }
        task.assignedTo = assignedTo;
      }
    } else {
      // Member: only status, and only for assigned tasks
      if (status !== undefined) {
        if (!['todo', 'in-progress', 'done'].includes(status)) {
          return res.status(400).json({ message: 'Invalid status' });
        }
        task.status = status;
      }
    }

    await task.save();
    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email role');
    res.json({ task: formatTask(populated) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update task' });
  }
}

export async function deleteTask(req, res) {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);
    if (!task || !task.project.equals(req.project._id)) {
      return res.status(404).json({ message: 'Task not found' });
    }
    await Task.findByIdAndDelete(id);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete task' });
  }
}
