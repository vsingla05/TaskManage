import { Router } from 'express';
import { body, param } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/role.js';
import { loadProjectMember } from '../middleware/projectAccess.js';
import * as projectController from '../controllers/projectController.js';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  requireAdmin,
  [
    body('name').trim().notEmpty().isLength({ max: 120 }),
    body('description').optional().isString().isLength({ max: 2000 }),
    body('memberIds').optional().isArray(),
    body('memberIds.*').optional().isMongoId(),
  ],
  projectController.createProject
);

router.get('/', projectController.listMyProjects);

router.get('/:id', param('id').isMongoId(), loadProjectMember, projectController.getProject);

router.patch(
  '/:id/members',
  requireAdmin,
  param('id').isMongoId(),
  loadProjectMember,
  [body('memberIds').isArray({ min: 1 }), body('memberIds.*').isMongoId()],
  projectController.addProjectMembers
);

router.delete(
  '/:id/members/:userId',
  requireAdmin,
  param('id').isMongoId(),
  param('userId').isMongoId(),
  loadProjectMember,
  projectController.removeProjectMember
);

router.delete(
  '/:id',
  requireAdmin,
  param('id').isMongoId(),
  loadProjectMember,
  projectController.deleteProject
);

export default router;
