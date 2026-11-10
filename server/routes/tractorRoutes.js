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

const router = Router();

router.get('/', getTractors);
router.post('/custom', createCustomTractor);
router.patch('/:id/verification', updateTractorVerification);
router.put('/:id/custom', resubmitCustomTractor);
router.get('/:id', getTractorById);
router.post('/', createTractor);
router.put('/:id', updateTractor);
router.delete('/:id', deleteTractor);

export default router;

