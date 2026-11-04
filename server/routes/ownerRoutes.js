import { Router } from 'express';
import {
  getOwners,
  getOwnerByMobile,
  createOrUpdateOwner,
  updateOwner,
  deleteOwner
} from '../controllers/ownerController.js';

const router = Router();

router.get('/', getOwners);
router.get('/:mobile', getOwnerByMobile);
router.post('/', createOrUpdateOwner);
router.put('/:mobile', updateOwner);
router.delete('/:mobile', deleteOwner);

export default router;

