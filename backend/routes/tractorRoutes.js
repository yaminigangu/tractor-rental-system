import { Router } from 'express';
import {
  getTractors,
  getTractorById,
  createTractor,
  createCustomTractor,
  updateTractorVerification,
  resubmitCustomTractor,
  updateTractor,
  deleteTractor
} from '../controllers/tractorController.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', getTractors);
router.post('/custom', createCustomTractor);
// Protected admin verification
router.patch('/:id/verification', authenticateUser, requireAdmin, updateTractorVerification);
router.put('/:id/custom', resubmitCustomTractor);
router.get('/:id', getTractorById);
router.post('/', createTractor);
router.put('/:id', updateTractor);
router.delete('/:id', deleteTractor);

export default router;

