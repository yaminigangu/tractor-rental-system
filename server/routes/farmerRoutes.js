import { Router } from 'express';
import {
  getFarmers,
  getFarmerByMobile,
  createOrUpdateFarmer,
  updateFarmer,
  deleteFarmer
} from '../controllers/farmerController.js';

const router = Router();

router.get('/', getFarmers);
router.get('/:mobile', getFarmerByMobile);
router.post('/', createOrUpdateFarmer);
router.put('/:mobile', updateFarmer);
router.delete('/:mobile', deleteFarmer);

export default router;
