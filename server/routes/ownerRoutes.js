import { Router } from 'express';
import {
  getOwners,
  getOwnerByMobile,
  createOrUpdateOwner,
  updateOwner,
  deleteOwner,
  toggleOwnerStatus
} from '../controllers/ownerController.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Protected admin-only endpoint
router.get('/', authenticateUser, requireAdmin, getOwners);

router.get('/:mobile', getOwnerByMobile);
router.post('/', createOrUpdateOwner);
router.put('/:mobile', updateOwner);
router.patch('/:id/status', authenticateUser, requireAdmin, toggleOwnerStatus);
router.delete('/:mobile', authenticateUser, deleteOwner);

export default router;

