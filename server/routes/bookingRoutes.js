import { Router } from 'express';
import {
  getMyBookings,
  getBookings,
  getBookingById,
  createBooking,
  updateBooking,
  updateBookingStatus,
  deleteBooking,
  checkAvailability
} from '../controllers/bookingController.js';
import { authenticateUser, requireAuth } from '../middleware/auth.js';

const router = Router();

// Apply token extraction to all booking routes
router.use(authenticateUser);

// Strict authenticated user booking history (MUST be before /:id)
router.get('/my', requireAuth, getMyBookings);

// Live slot availability check (MUST be before /:id)
router.get('/check-availability', checkAvailability);

// General listings with optional filters
router.get('/', getBookings);

// Single booking with IDOR protection
router.get('/:id', getBookingById);

// Create new booking (auto-associates authenticated farmer if present)
router.post('/', createBooking);

// Update/Cancel operations with IDOR protection
router.put('/:id', updateBooking);
router.patch('/:id/status', updateBookingStatus);
router.put('/:id/status', updateBookingStatus);
router.delete('/:id', deleteBooking);

export default router;
