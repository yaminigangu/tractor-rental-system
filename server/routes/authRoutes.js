import { Router } from 'express';
import { 
  issueSessionToken, 
  getCurrentUser, 
  adminLogin, 
  register, 
  login,
  getUserProfile,
  updateUserProfile,
  changePassword,
  deleteAccount
} from '../controllers/authController.js';
import { authenticateUser, requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/token', issueSessionToken);
router.post('/admin-login', adminLogin);
router.get('/me', authenticateUser, requireAuth, getCurrentUser);

// Profile and Account Settings
router.get('/profile', authenticateUser, getUserProfile);
router.put('/profile', authenticateUser, updateUserProfile);
router.post('/change-password', authenticateUser, changePassword);
router.delete('/delete-account', authenticateUser, deleteAccount);

export default router;

