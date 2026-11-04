import { Router } from 'express';
import {
  getTractors,
  getTractorById,
  createTractor,
  updateTractor,
  deleteTractor
} from '../controllers/tractorController.js';

const router = Router();

router.get('/', getTractors);
router.get('/:id', getTractorById);
router.post('/', createTractor);
router.put('/:id', updateTractor);
router.delete('/:id', deleteTractor);

export default router;

