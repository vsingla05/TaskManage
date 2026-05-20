import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/role.js';
import * as userController from '../controllers/userController.js';

const router = Router();

router.use(authenticate, requireAdmin);
router.get('/search', userController.searchUsers);

export default router;
