import { Router } from 'express';
import {
  getFarmers,
  getFarmerByMobile,
  createOrUpdateFarmer,
  updateFarmer,
  deleteFarmer,
  toggleFarmerStatus
} from '../controllers/farmerController.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Protected admin endpoint
router.get('/', authenticateUser, requireAdmin, getFarmers);

router.get('/:mobile', getFarmerByMobile);
router.post('/', createOrUpdateFarmer);
router.put('/:mobile', updateFarmer);
router.patch('/:id/status', authenticateUser, requireAdmin, toggleFarmerStatus);
router.delete('/:mobile', authenticateUser, deleteFarmer);

export default router;

