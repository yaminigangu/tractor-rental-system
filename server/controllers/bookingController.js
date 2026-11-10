import { query } from '../db.js';
import { createInAppNotification } from './notificationController.js';
import { sendWhatsAppNotification } from '../services/whatsAppService.js';

/**
 * Generate a unique standardized Booking Code e.g. TRC1025
 */
export async function generateBookingCode() {
  try {
    const res = await query('SELECT COALESCE(MAX(id), 1000) as max_id FROM bookings');
    const nextNum = (parseInt(res.rows[0]?.max_id || 1000, 10) % 9000) + 1000;
    return `TRC${nextNum}`;
  } catch {
    return `TRC${Math.floor(1000 + Math.random() * 9000)}`;
  }
}

/**
 * Common SQL projection for Bookings
 */
const BOOKINGS_SELECT = `
  SELECT b.id,
         COALESCE(b.booking_code, 'TRC' || LPAD((b.id % 10000)::text, 4, '0')) as "bookingCode",
         b.farmer_name as "farmerName", b.farmer_mobile as "farmerMobile",
         b.farmer_village as "farmerVillage", b.farmer_id as "farmerId",
         b.tractor_id as "tractorId", b.tractor_model as "tractorModel",
         b.tractor_owner as "tractorOwner",
         COALESCE(NULLIF(b.owner_mobile, ''), t.default_mobile, '') as "ownerMobile",
         COALESCE(b.registration_no, 'TS 03 AB 4589') as "registrationNo",
         b.work_type as "workType", b.land_area as "landArea",
         b.booking_date as "bookingDate", b.booking_time as "bookingTime",
         COALESCE(b.time_slot, b.booking_time, '09:00 AM – 01:00 PM') as "timeSlot",
         b.start_time as "startTime", b.end_time as "endTime",
         b.duration_hours as "durationHours", b.estimated_cost as "estimatedCost",
         COALESCE(b.advance_payment, 0) as "advancePayment",
         b.status, b.remarks,
         b.rejection_reason as "rejectionReason",
         b.cancellation_reason as "cancellationReason",
         COALESCE(b.activity_log, '[]'::jsonb) as "activityLog",
         COALESCE(b.payment_status, 'Pending Cash on Service') as "paymentStatus",
         b.created_at as "createdAt",
         COALESCE(t.photo, b.tractor_photo, '') as "tractorPhoto",
         COALESCE(t.model, b.tractor_model, '') as "tractorModelName",
         COALESCE(t.brand, 'AgriRent') as "tractorBrand",
         COALESCE(t.default_owner, b.tractor_owner, 'Local Owner') as "ownerFullName"
  FROM bookings b
  LEFT JOIN tractors t ON b.tractor_id = t.id
`;

/**
 * GET /api/bookings/check-availability
 * Validates whether a tractor is available or has overlapping bookings on the given date and time slot
 */
export async function checkAvailability(req, res, next) {
  try {
    const { tractorId, date, timeSlot } = req.query;
    if (!tractorId || !date) {
      return res.status(400).json({ success: false, error: 'tractorId and date are required' });
    }

    const tid = parseInt(tractorId, 10);
    const slot = timeSlot || '09:00 AM – 01:00 PM';

    // Find any conflicting booking on that tractor and date that is NOT cancelled or rejected
    const conflictRes = await query(
      `SELECT id, booking_code as "bookingCode", tractor_model as "tractorModel",
              time_slot as "timeSlot", status, farmer_name as "farmerName"
       FROM bookings
       WHERE tractor_id = $1
         AND booking_date = $2
         AND status NOT IN ('Cancelled', 'Rejected')
         AND (time_slot = $3 OR time_slot LIKE '%Full Day%' OR $3 LIKE '%Full Day%')
       LIMIT 1`,
      [tid, date, slot]
    );

    const isAvailable = conflictRes.rows.length === 0;

    res.json({
      success: true,
      available: isAvailable,
      tractorId: tid,
      date,
      timeSlot: slot,
      conflict: isAvailable ? null : conflictRes.rows[0]
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/bookings/my
 * Securely retrieves bookings ONLY for the authenticated farmer or owner.
 */
export async function getMyBookings(req, res, next) {
  try {
    const user = req.user;
    if (!user || !user.mobile) {
      return res.status(401).json({
        error: 'Unauthorized: Valid authentication token is required to view your booking records.',
        code: 'AUTH_REQUIRED',
      });
    }

    const cleanMobile = String(user.mobile).replace(/\D/g, '');
    const userId = user.id ? parseInt(user.id, 10) : null;
    const isOwnerRole = user.role === 'owner';
    const params = [userId, cleanMobile, `%${cleanMobile.slice(-10)}`];

    let whereClause = '';
    if (isOwnerRole) {
      whereClause = `
        WHERE (
          b.owner_mobile = $2
          OR b.owner_mobile LIKE $3
          OR t.default_mobile = $2
          OR t.default_mobile LIKE $3
        )
      `;
    } else {
      whereClause = `
        WHERE (
          (b.farmer_id IS NOT NULL AND b.farmer_id = $1)
          OR b.farmer_mobile = $2
          OR b.farmer_mobile LIKE $3
        )
      `;
    }

    const sql = `
      ${BOOKINGS_SELECT}
      ${whereClause}
      ORDER BY b.id DESC
    `;

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/bookings
 * Retrieve all work order bookings with optional filters
 */
export async function getBookings(req, res, next) {
  try {
    const { farmerMobile, ownerMobile, tractorId, status, date, village } = req.query;

    let sql = `${BOOKINGS_SELECT} WHERE 1=1`;
    const params = [];

    if (farmerMobile) {
      const cleanMobile = String(farmerMobile).replace(/\D/g, '');
      params.push(`%${cleanMobile.slice(-10)}`);
      sql += ` AND b.farmer_mobile LIKE $${params.length}`;
    }

    if (ownerMobile) {
      const cleanOwner = String(ownerMobile).replace(/\D/g, '');
      params.push(`%${cleanOwner.slice(-10)}`);
      sql += ` AND (b.owner_mobile LIKE $${params.length} OR t.default_mobile LIKE $${params.length})`;
    }

    if (tractorId) {
      params.push(parseInt(tractorId, 10));
      sql += ` AND b.tractor_id = $${params.length}`;
    }

    if (status && status !== 'All') {
      if (status === 'Confirmed') {
        sql += ` AND b.status IN ('Confirmed', 'Approved')`;
      } else if (status === 'Pending') {
        sql += ` AND b.status = 'Pending Approval'`;
      } else {
        params.push(status);
        sql += ` AND b.status = $${params.length}`;
      }
    }

    if (date) {
      params.push(date);
      sql += ` AND b.booking_date = $${params.length}`;
    }

    if (village) {
      params.push(`%${village.toLowerCase()}%`);
      sql += ` AND LOWER(b.farmer_village) LIKE $${params.length}`;
    }

    sql += ` ORDER BY b.id DESC`;

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/bookings/:id
 * Retrieve a specific booking receipt / invoice
 */
export async function getBookingById(req, res, next) {
  try {
    const { id } = req.params;
    const result = await query(
      `${BOOKINGS_SELECT} WHERE b.id = $1`,
      [parseInt(id, 10)]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Booking work order not found' });
    }

    const booking = result.rows[0];

    // IDOR Protection: If requester is authenticated as a farmer, ensure they own the booking
    if (req.user && req.user.role === 'farmer') {
      const userPhone = String(req.user.mobile).replace(/\D/g, '').slice(-10);
      const bookingPhone = String(booking.farmerMobile).replace(/\D/g, '').slice(-10);
      const isOwner = (userPhone && bookingPhone && userPhone === bookingPhone) ||
                      (req.user.id && booking.farmerId && req.user.id === booking.farmerId);

      if (!isOwner) {
        return res.status(403).json({
          error: "Forbidden: You are not authorized to view another farmer's booking order (IDOR Protection).",
          code: 'IDOR_ACCESS_DENIED'
        });
      }
    }

    res.json(booking);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/bookings
 * Create a new tractor booking with overlap collision detection, WhatsApp dispatch & in-app notifications
 */
export async function createBooking(req, res, next) {
  try {
    const b = req.body;
    const id = b.id ? parseInt(b.id, 10) : Date.now();

    if (!b.farmerName || !b.workType) {
      return res.status(400).json({ error: 'Farmer name and work type are required' });
    }

    const authUser = req.user;
    const farmerId = authUser?.id || b.farmerId || null;
    const typedFarmerMobile = b.farmerMobile ? String(b.farmerMobile).replace(/\D/g, '') : '';
    const farmerMobile = typedFarmerMobile || (authUser?.mobile ? String(authUser.mobile).replace(/\D/g, '') : '9876543210');
    const farmerName = (b.farmerName || authUser?.name || 'Farmer').trim();

    const tractorIdInt = b.tractorId ? parseInt(b.tractorId, 10) : (b.assignedTractorId ? parseInt(b.assignedTractorId, 10) : null);
    const bookingDate = b.bookingDate || new Date().toISOString().split('T')[0];
    const timeSlot = b.timeSlot || b.time_slot || b.bookingTime || '09:00 AM – 01:00 PM';

    // 1. Strict Double-Booking & Time Slot Overlap Prevention
    if (tractorIdInt && bookingDate) {
      const collisionCheck = await query(
        `SELECT id, booking_code as "bookingCode", tractor_model as "tractorModel", time_slot as "timeSlot"
         FROM bookings
         WHERE tractor_id = $1
           AND booking_date = $2
           AND status NOT IN ('Cancelled', 'Rejected')
           AND (time_slot = $3 OR time_slot LIKE '%Full Day%' OR $3 LIKE '%Full Day%')
         LIMIT 1`,
        [tractorIdInt, bookingDate, timeSlot]
      );

      if (collisionCheck.rows.length > 0) {
        const conflict = collisionCheck.rows[0];
        return res.status(409).json({
          success: false,
          conflict: true,
          error: `Double Booking Prevented: This tractor is already booked on ${bookingDate} for slot "${conflict.timeSlot}". Please choose an alternative time slot or select another available tractor.`,
          code: 'OVERLAPPING_TIME_SLOT',
          conflictingBooking: conflict
        });
      }
    }

    // Look up tractor details for photo, registration number, model, owner, and owner phone
    let tractorPhoto = b.tractorPhoto || '';
    let registrationNo = b.registrationNo || 'TS 03 AB 4589';
    let ownerMobile = b.ownerMobile ? String(b.ownerMobile).replace(/\D/g, '') : '';
    let tractorOwner = b.tractorOwner || '';
    let tractorModel = b.tractorModel || '';

    if (tractorIdInt) {
      const tRes = await query(
        'SELECT photo, brand, model, default_owner, default_mobile FROM tractors WHERE id = $1',
        [tractorIdInt]
      );
      if (tRes.rows.length > 0) {
        const row = tRes.rows[0];
        tractorPhoto = tractorPhoto || row.photo;
        if (!ownerMobile && row.default_mobile) {
          ownerMobile = String(row.default_mobile).replace(/\D/g, '');
        }
        if (!tractorOwner && row.default_owner) {
          tractorOwner = row.default_owner;
        }
        if (!tractorModel && row.model) {
          tractorModel = `${row.brand || ''} ${row.model}`.trim();
        }
      }
    }

    const bookingCode = b.bookingCode || await generateBookingCode();
    const initialActivity = [
      {
        timestamp: new Date().toISOString(),
        status: 'Pending Approval',
        actor: farmerName,
        role: 'customer',
        note: 'Tractor rental booking request submitted by customer'
      }
    ];

    const text = `
      INSERT INTO bookings (
        id, booking_code, farmer_id, farmer_name, farmer_mobile, farmer_village, tractor_id, tractor_model,
        tractor_owner, owner_mobile, registration_no, work_type, land_area, booking_date,
        booking_time, time_slot, duration_hours, estimated_cost, advance_payment, status, payment_status, remarks,
        tractor_photo, activity_log
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
      RETURNING id, booking_code as "bookingCode", farmer_id as "farmerId", farmer_name as "farmerName",
                farmer_mobile as "farmerMobile", farmer_village as "farmerVillage", tractor_id as "tractorId",
                tractor_model as "tractorModel", tractor_owner as "tractorOwner",
                owner_mobile as "ownerMobile", registration_no as "registrationNo",
                work_type as "workType", land_area as "landArea",
                booking_date as "bookingDate", booking_time as "bookingTime",
                time_slot as "timeSlot", duration_hours as "durationHours", estimated_cost as "estimatedCost",
                advance_payment as "advancePayment", status, payment_status as "paymentStatus", remarks,
                tractor_photo as "tractorPhoto", activity_log as "activityLog", created_at as "createdAt";
    `;

    const values = [
      id,
      bookingCode,
      farmerId,
      farmerName,
      farmerMobile,
      b.farmerVillage || 'Hasanparthy',
      tractorIdInt,
      tractorModel || b.tractorModel || 'Assigned Tractor',
      tractorOwner || b.tractorOwner || 'Local Fleet Owner',
      ownerMobile,
      registrationNo,
      b.workType || 'Ploughing',
      parseFloat(b.landArea) || 2.0,
      bookingDate,
      b.bookingTime || '07:00 AM',
      timeSlot,
      parseInt(b.durationHours, 10) || 4,
      parseInt(b.estimatedCost, 10) || 0,
      parseInt(b.advancePayment, 10) || 0,
      b.status || 'Pending Approval',
      b.paymentStatus || 'Pending Cash on Service',
      b.remarks || '',
      tractorPhoto,
      JSON.stringify(initialActivity)
    ];

    const result = await query(text, values);
    const created = result.rows[0];

    // 2. Dispatch In-App Notification to Tractor Owner
    if (ownerMobile) {
      await createInAppNotification({
        userMobile: ownerMobile,
        userRole: 'owner',
        title: `🚜 New Booking Request (${bookingCode})`,
        message: `${farmerName} requested ${created.workType} (${created.landArea} Acres) on ${bookingDate} [${timeSlot}]. Click to review & confirm.`,
        type: 'new_booking_request',
        bookingId: id
      });
    }

    // 3. Dispatch In-App Notification to Customer
    await createInAppNotification({
      userMobile: farmerMobile,
      userRole: 'farmer',
      title: `📋 Booking Request Dispatched (${bookingCode})`,
      message: `Your booking for ${created.tractorModel} on ${bookingDate} [${timeSlot}] is placed and awaiting owner confirmation.`,
      type: 'booking_submitted',
      bookingId: id
    });

    // 4. Dispatch Official WhatsApp Notification to Tractor Owner (Cloud API + Fallback)
    const whatsAppNotification = await sendWhatsAppNotification({
      recipientPhone: ownerMobile || '9876543210',
      type: 'new_booking_to_owner',
      booking: created
    });

    res.status(201).json({
      success: true,
      booking: created,
      ...created,
      whatsapp: whatsAppNotification,
      whatsAppNotification
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/bookings/:id
 * Update booking work order
 */
export async function updateBooking(req, res, next) {
  try {
    const { id } = req.params;
    const b = req.body;

    const checkRes = await query(
      'SELECT id, farmer_id as "farmerId", farmer_mobile as "farmerMobile", activity_log as "activityLog" FROM bookings WHERE id = $1',
      [parseInt(id, 10)]
    );
    if (checkRes.rowCount === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    let activity = Array.isArray(checkRes.rows[0].activityLog) ? checkRes.rows[0].activityLog : [];
    activity.push({
      timestamp: new Date().toISOString(),
      status: b.status || 'Updated',
      actor: req.user?.name || 'User',
      role: req.user?.role || 'customer',
      note: 'Booking specs or parameters updated'
    });

    const text = `
      UPDATE bookings SET
        farmer_name = COALESCE($1, farmer_name),
        farmer_village = COALESCE($2, farmer_village),
        work_type = COALESCE($3, work_type),
        land_area = COALESCE($4, land_area),
        booking_date = COALESCE($5, booking_date),
        booking_time = COALESCE($6, booking_time),
        time_slot = COALESCE($7, time_slot),
        duration_hours = COALESCE($8, duration_hours),
        estimated_cost = COALESCE($9, estimated_cost),
        advance_payment = COALESCE($10, advance_payment),
        status = COALESCE($11, status),
        remarks = COALESCE($12, remarks),
        payment_status = COALESCE($13, payment_status),
        activity_log = $14
      WHERE id = $15
      RETURNING id, booking_code as "bookingCode", farmer_name as "farmerName",
                farmer_mobile as "farmerMobile", tractor_model as "tractorModel",
                work_type as "workType", status, payment_status as "paymentStatus",
                estimated_cost as "estimatedCost", time_slot as "timeSlot";
    `;

    const values = [
      b.farmerName ? b.farmerName.trim() : null,
      b.farmerVillage || null,
      b.workType || null,
      b.landArea ? parseFloat(b.landArea) : null,
      b.bookingDate || null,
      b.bookingTime || null,
      b.timeSlot || null,
      b.durationHours ? parseInt(b.durationHours, 10) : null,
      b.estimatedCost ? parseInt(b.estimatedCost, 10) : null,
      b.advancePayment !== undefined ? parseInt(b.advancePayment, 10) : null,
      b.status || null,
      b.remarks || null,
      b.paymentStatus || null,
      JSON.stringify(activity),
      parseInt(id, 10)
    ];

    const result = await query(text, values);
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/bookings/:id/status
 * Update booking workflow status (Confirm, Reject, Cancel, Complete) + Synchronize Notifications & WhatsApp
 */
export async function updateBookingStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, paymentStatus, rejectionReason, cancellationReason } = req.body;

    if (!status && !paymentStatus) {
      return res.status(400).json({ error: 'Status or paymentStatus is required' });
    }

    const checkRes = await query(
      `${BOOKINGS_SELECT} WHERE b.id = $1`,
      [parseInt(id, 10)]
    );
    if (checkRes.rowCount === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = checkRes.rows[0];
    const targetStatus = status || booking.status;

    let activity = Array.isArray(booking.activityLog) ? booking.activityLog : [];
    activity.push({
      timestamp: new Date().toISOString(),
      fromStatus: booking.status,
      toStatus: targetStatus,
      actor: req.user?.name || (targetStatus === 'Cancelled' ? booking.farmerName : booking.tractorOwner),
      role: req.user?.role || (targetStatus === 'Cancelled' ? 'customer' : 'owner'),
      note: rejectionReason || cancellationReason || `Status transitioned to ${targetStatus}`
    });

    const updateSql = `
      UPDATE bookings SET
        status = COALESCE($1, status),
        payment_status = COALESCE($2, payment_status),
        rejection_reason = COALESCE($3, rejection_reason),
        cancellation_reason = COALESCE($4, cancellation_reason),
        activity_log = $5
      WHERE id = $6
      RETURNING id, booking_code as "bookingCode", status, payment_status as "paymentStatus",
                farmer_name as "farmerName", farmer_mobile as "farmerMobile",
                tractor_model as "tractorModel", tractor_owner as "tractorOwner",
                owner_mobile as "ownerMobile", booking_date as "bookingDate",
                time_slot as "timeSlot", estimated_cost as "estimatedCost",
                rejection_reason as "rejectionReason", cancellation_reason as "cancellationReason";
    `;

    const values = [
      status || null,
      paymentStatus || null,
      rejectionReason || null,
      cancellationReason || null,
      JSON.stringify(activity),
      parseInt(id, 10)
    ];

    const result = await query(updateSql, values);
    const updated = result.rows[0];

    let whatsAppNotification = null;

    // 1. Owner Confirmed Booking
    if (targetStatus === 'Confirmed' || targetStatus === 'Approved') {
      await createInAppNotification({
        userMobile: booking.farmerMobile,
        userRole: 'farmer',
        title: `✅ Booking Confirmed (${booking.bookingCode})`,
        message: `${booking.tractorOwner} has CONFIRMED your tractor booking for ${booking.bookingDate} [${booking.timeSlot}].`,
        type: 'booking_confirmed',
        bookingId: parseInt(id, 10)
      });

      whatsAppNotification = await sendWhatsAppNotification({
        recipientPhone: booking.farmerMobile,
        type: 'booking_confirmed_to_farmer',
        booking: { ...booking, status: 'Confirmed' }
      });
    }

    // 2. Owner Rejected Booking
    if (targetStatus === 'Rejected' || targetStatus.includes('Declined')) {
      const reasonText = rejectionReason || 'Tractor occupied or field unavailable';
      await createInAppNotification({
        userMobile: booking.farmerMobile,
        userRole: 'farmer',
        title: `❌ Booking Rejected (${booking.bookingCode})`,
        message: `Tractor owner could not accept your booking request for ${booking.bookingDate}. Reason: ${reasonText}`,
        type: 'booking_rejected',
        bookingId: parseInt(id, 10)
      });

      whatsAppNotification = await sendWhatsAppNotification({
        recipientPhone: booking.farmerMobile,
        type: 'booking_rejected_to_farmer',
        booking: { ...booking, status: 'Rejected', rejectionReason: reasonText }
      });
    }

    // 3. Customer Cancelled Booking
    if (targetStatus === 'Cancelled') {
      const cancelReason = cancellationReason || 'Cancelled by customer';
      if (booking.ownerMobile) {
        await createInAppNotification({
          userMobile: booking.ownerMobile,
          userRole: 'owner',
          title: `⚠️ Booking Cancelled (${booking.bookingCode})`,
          message: `${booking.farmerName} cancelled their booking request on ${booking.bookingDate} [${booking.timeSlot}].`,
          type: 'booking_cancelled',
          bookingId: parseInt(id, 10)
        });

        whatsAppNotification = await sendWhatsAppNotification({
          recipientPhone: booking.ownerMobile,
          type: 'booking_cancelled_to_owner',
          booking: { ...booking, status: 'Cancelled' }
        });
      }
    }

    res.json({
      success: true,
      booking: updated,
      ...updated,
      whatsapp: whatsAppNotification,
      whatsAppNotification
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/bookings/:id
 * Delete / cancel a booking with IDOR protection
 */
export async function deleteBooking(req, res, next) {
  try {
    const { id } = req.params;

    const checkRes = await query(
      'SELECT id, farmer_id as "farmerId", farmer_mobile as "farmerMobile" FROM bookings WHERE id = $1',
      [parseInt(id, 10)]
    );
    if (checkRes.rowCount === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const result = await query(
      'DELETE FROM bookings WHERE id = $1 RETURNING id, farmer_name as "farmerName"',
      [parseInt(id, 10)]
    );

    res.json({
      message: `Booking #${id} deleted successfully`,
      deleted: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
}
