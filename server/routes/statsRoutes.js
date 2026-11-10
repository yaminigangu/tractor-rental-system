import { Router } from 'express';
import { getDashboardStats } from '../controllers/statsController.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Protected admin-only stats endpoint
router.get('/', authenticateUser, requireAdmin, getDashboardStats);

export default router;

