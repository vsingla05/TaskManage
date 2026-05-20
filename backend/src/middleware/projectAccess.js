import Project from '../models/Project.js';

/**
 * Load project and ensure requester is a member (or creator).
 * Sets req.project for downstream handlers.
 */
export async function loadProjectMember(req, res, next) {
  try {
    const projectId = req.params.projectId || req.params.id;
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    const uid = req.user._id;
    const uidStr = String(uid);
    const isCreator = String(project.createdBy) === uidStr;
    const isMember = project.members.some((m) => String(m) === uidStr);
    if (!isCreator && !isMember) {
      return res.status(403).json({ message: 'You are not a member of this project' });
    }
    req.project = project;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load project' });
  }
}
