import { Router } from 'express';
import { issueSessionToken, getCurrentUser, adminLogin, register, login } from '../controllers/authController.js';
import { authenticateUser, requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/token', issueSessionToken);
router.post('/admin-login', adminLogin);
router.get('/me', authenticateUser, requireAuth, getCurrentUser);

export default router;

