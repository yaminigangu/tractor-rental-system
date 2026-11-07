import { Router } from 'express';
import { issueSessionToken, getCurrentUser, adminLogin } from '../controllers/authController.js';
import { authenticateUser, requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/token', issueSessionToken);
router.post('/admin-login', adminLogin);
router.get('/me', authenticateUser, requireAuth, getCurrentUser);

export default router;

