import { Router } from 'express';
import {
  sendOtpHandler,
  verifyOtpHandler,
  getOtpStatusHandler
} from '../controllers/otpController.js';

const router = Router();

router.get('/status', getOtpStatusHandler);
router.post('/send', sendOtpHandler);
router.post('/verify', verifyOtpHandler);

export default router;

