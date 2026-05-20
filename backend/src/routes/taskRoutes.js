import { Router } from 'express';
import { body, param } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/role.js';
import { loadProjectMember } from '../middleware/projectAccess.js';
import * as taskController from '../controllers/taskController.js';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get('/', loadProjectMember, taskController.listTasks);

router.post(
  '/',
  requireAdmin,
  loadProjectMember,
  [
    body('title').trim().notEmpty().isLength({ max: 200 }),
    body('description').optional().isString().isLength({ max: 5000 }),
    body('dueDate').isISO8601().toDate(),
    body('assignedTo').isMongoId(),
    body('status').optional().isIn(['todo', 'in-progress', 'done']),
  ],
  taskController.createTask
);

router.patch(
  '/:id',
  param('id').isMongoId(),
  loadProjectMember,
  [
    body('title').optional().trim().notEmpty().isLength({ max: 200 }),
    body('description').optional().isString().isLength({ max: 5000 }),
    body('dueDate').optional().isISO8601().toDate(),
    body('assignedTo').optional().isMongoId(),
    body('status').optional().isIn(['todo', 'in-progress', 'done']),
  ],
  taskController.updateTask
);

router.delete(
  '/:id',
  requireAdmin,
  param('id').isMongoId(),
  loadProjectMember,
  taskController.deleteTask
);

export default router;
