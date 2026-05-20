import Project from '../models/Project.js';
import User from '../models/User.js';
import Task from '../models/Task.js';
import { validationResult } from 'express-validator';

function validate(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    return true;
  }
  return false;
}

/** Admin creating project: creator is always added to members. */
export async function createProject(req, res) {
  if (validate(req, res)) return;
  try {
    const { name, description, memberIds = [] } = req.body;
    const creatorId = req.user._id;
    const members = new Set([creatorId.toString(), ...memberIds.map(String)]);
    const users = await User.find({ _id: { $in: [...members] } });
    if (users.length !== members.size) {
      return res.status(400).json({ message: 'One or more member IDs are invalid' });
    }
    const project = await Project.create({
      name,
      description: description || '',
      createdBy: creatorId,
      members: [...members],
    });
    const populated = await Project.findById(project._id)
      .populate('createdBy', 'name email role')
      .populate('members', 'name email role');
    res.status(201).json({ project: populated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create project' });
  }
}

/** Projects the current user belongs to. */
export async function listMyProjects(req, res) {
  try {
    const uid = req.user._id;
    const projects = await Project.find({
      $or: [{ members: uid }, { createdBy: uid }],
    })
      .populate('createdBy', 'name email role')
      .populate('members', 'name email role')
      .sort({ updatedAt: -1 });
    res.json({ projects });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to list projects' });
  }
}

export async function getProject(req, res) {
  try {
    const project = await Project.findById(req.project._id)
      .populate('createdBy', 'name email role')
      .populate('members', 'name email role');
    res.json({ project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load project' });
  }
}

/**
 * Add members (admin only, must already be on the project).
 */
export async function addProjectMembers(req, res) {
  if (validate(req, res)) return;
  try {
    const { memberIds } = req.body;
    const project = req.project;
    const toAdd = await User.find({ _id: { $in: memberIds } });
    if (toAdd.length !== memberIds.length) {
      return res.status(400).json({ message: 'One or more user IDs are invalid' });
    }
    const existing = new Set(project.members.map((m) => m.toString()));
    for (const id of memberIds) {
      if (!existing.has(String(id))) {
        project.members.push(id);
        existing.add(String(id));
      }
    }
    await project.save();
    const populated = await Project.findById(project._id)
      .populate('createdBy', 'name email role')
      .populate('members', 'name email role');
    res.json({ project: populated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to add members' });
  }
}

export async function removeProjectMember(req, res) {
  if (validate(req, res)) return;
  try {
    const { userId } = req.params;
    const project = req.project;
    if (project.createdBy.equals(userId)) {
      return res.status(400).json({ message: 'Cannot remove the project owner' });
    }
    project.members = project.members.filter((m) => !m.equals(userId));
    await project.save();
    await Task.updateMany(
      { project: project._id, assignedTo: userId },
      { $set: { assignedTo: project.createdBy } }
    );
    const populated = await Project.findById(project._id)
      .populate('createdBy', 'name email role')
      .populate('members', 'name email role');
    res.json({ project: populated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to remove member' });
  }
}

export async function deleteProject(req, res) {
  try {
    const project = req.project;
    if (!project.createdBy.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only the project owner can delete the project' });
    }
    await Task.deleteMany({ project: project._id });
    await Project.findByIdAndDelete(project._id);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete project' });
  }
}
