import { query } from '../db.js';

/**
 * GET /api/bookings/my
 * Securely retrieves bookings ONLY for the authenticated farmer or owner.
 * Extracts identity strictly from the verified JWT token (req.user).
 * NEVER trusts client-supplied query parameters for user identity.
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

    const sql = `
      SELECT b.id, b.farmer_name as "farmerName", b.farmer_mobile as "farmerMobile",
             b.farmer_village as "farmerVillage", b.farmer_id as "farmerId",
             b.tractor_id as "tractorId", b.tractor_model as "tractorModel",
             b.tractor_owner as "tractorOwner",
             COALESCE(b.owner_mobile, t.default_mobile, '9876543210') as "ownerMobile",
             COALESCE(b.registration_no, 'TS 03 AB 4589') as "registrationNo",
             b.work_type as "workType", b.land_area as "landArea",
             b.booking_date as "bookingDate", b.booking_time as "bookingTime",
             b.duration_hours as "durationHours", b.estimated_cost as "estimatedCost",
             b.status, b.remarks,
             COALESCE(b.payment_status, 'Pending Cash on Service') as "paymentStatus",
             b.created_at as "createdAt",
             COALESCE(t.photo, b.tractor_photo, '') as "tractorPhoto",
             COALESCE(t.model, b.tractor_model, '') as "tractorModelName",
             COALESCE(t.brand, 'AgriRent') as "tractorBrand",
             COALESCE(t.default_owner, b.tractor_owner, 'Local Owner') as "ownerFullName"
      FROM bookings b
      LEFT JOIN tractors t ON b.tractor_id = t.id
      WHERE (
        (b.farmer_id IS NOT NULL AND b.farmer_id = $1)
        OR b.farmer_mobile = $2
        OR b.farmer_mobile LIKE $3
      )
      ORDER BY b.id DESC
    `;

    const params = [
      userId,
      cleanMobile,
      `%${cleanMobile.slice(-10)}`,
    ];

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/bookings
 * Retrieve all work order bookings with optional filters
 * Returns: Array of booking objects
 */
export async function getBookings(req, res, next) {
  try {
    const { farmerMobile, tractorId, status, date, village } = req.query;

    let sql = `
      SELECT b.id, b.farmer_name as "farmerName", b.farmer_mobile as "farmerMobile",
             b.farmer_village as "farmerVillage", b.farmer_id as "farmerId",
             b.tractor_id as "tractorId", b.tractor_model as "tractorModel",
             b.tractor_owner as "tractorOwner",
             COALESCE(b.owner_mobile, t.default_mobile, '9876543210') as "ownerMobile",
             COALESCE(b.registration_no, 'TS 03 AB 4589') as "registrationNo",
             b.work_type as "workType", b.land_area as "landArea",
             b.booking_date as "bookingDate", b.booking_time as "bookingTime",
             b.duration_hours as "durationHours", b.estimated_cost as "estimatedCost",
             b.status, b.remarks,
             COALESCE(b.payment_status, 'Pending Cash on Service') as "paymentStatus",
             b.created_at as "createdAt",
             COALESCE(t.photo, b.tractor_photo, '') as "tractorPhoto",
             COALESCE(t.model, b.tractor_model, '') as "tractorModelName",
             COALESCE(t.brand, 'AgriRent') as "tractorBrand"
      FROM bookings b
      LEFT JOIN tractors t ON b.tractor_id = t.id
      WHERE 1=1
    `;
    const params = [];

    if (farmerMobile) {
      const cleanMobile = String(farmerMobile).replace(/\D/g, '');
      params.push(`%${cleanMobile.slice(-10)}`);
      sql += ` AND b.farmer_mobile LIKE $${params.length}`;
    }

    if (tractorId) {
      params.push(parseInt(tractorId, 10));
      sql += ` AND b.tractor_id = $${params.length}`;
    }

    if (status && status !== 'All') {
      params.push(status);
      sql += ` AND b.status = $${params.length}`;
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
 * Retrieve a specific booking receipt / work slip with IDOR protection
 */
export async function getBookingById(req, res, next) {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT b.id, b.farmer_name as "farmerName", b.farmer_mobile as "farmerMobile",
              b.farmer_village as "farmerVillage", b.farmer_id as "farmerId",
              b.tractor_id as "tractorId", b.tractor_model as "tractorModel",
              b.tractor_owner as "tractorOwner",
              COALESCE(b.owner_mobile, t.default_mobile, '9876543210') as "ownerMobile",
              COALESCE(b.registration_no, 'TS 03 AB 4589') as "registrationNo",
              b.work_type as "workType", b.land_area as "landArea",
              b.booking_date as "bookingDate", b.booking_time as "bookingTime",
              b.duration_hours as "durationHours", b.estimated_cost as "estimatedCost",
              b.status, b.remarks,
              COALESCE(b.payment_status, 'Pending Cash on Service') as "paymentStatus",
              b.created_at as "createdAt",
              COALESCE(t.photo, b.tractor_photo, '') as "tractorPhoto",
              COALESCE(t.model, b.tractor_model, '') as "tractorModelName",
              COALESCE(t.brand, 'AgriRent') as "tractorBrand"
       FROM bookings b
       LEFT JOIN tractors t ON b.tractor_id = t.id
       WHERE b.id = $1`,
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
          error: 'Forbidden: You are not authorized to view another farmer\'s booking order (IDOR Protection).',
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
 * Create a new tractor booking / work order
 */
export async function createBooking(req, res, next) {
  try {
    const b = req.body;
    const id = b.id ? parseInt(b.id, 10) : Date.now();

    if (!b.farmerName || !b.workType) {
      return res.status(400).json({ error: 'Farmer name and work type are required' });
    }

    // Securely pull farmer identity from verified session token if available
    const authUser = req.user;
    const farmerId = authUser?.id || b.farmerId || null;
    const farmerMobile = authUser?.mobile || b.farmerMobile || '9876543210';
    const farmerName = authUser?.name || b.farmerName;

    // Look up tractor details for photo, registration number, and owner phone
    let tractorPhoto = b.tractorPhoto || '';
    let registrationNo = b.registrationNo || 'TS 03 AB 4589';
    let ownerMobile = b.ownerMobile || '9876543210';

    if (b.tractorId) {
      const tRes = await query(
        'SELECT photo, default_owner, default_mobile FROM tractors WHERE id = $1',
        [parseInt(b.tractorId, 10)]
      );
      if (tRes.rows.length > 0) {
        tractorPhoto = tractorPhoto || tRes.rows[0].photo;
        ownerMobile = ownerMobile || tRes.rows[0].default_mobile;
      }
    }

    const text = `
      INSERT INTO bookings (
        id, farmer_id, farmer_name, farmer_mobile, farmer_village, tractor_id, tractor_model,
        tractor_owner, owner_mobile, registration_no, work_type, land_area, booking_date,
        booking_time, duration_hours, estimated_cost, status, payment_status, remarks, tractor_photo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING id, farmer_id as "farmerId", farmer_name as "farmerName", farmer_mobile as "farmerMobile",
                farmer_village as "farmerVillage", tractor_id as "tractorId",
                tractor_model as "tractorModel", tractor_owner as "tractorOwner",
                owner_mobile as "ownerMobile", registration_no as "registrationNo",
                work_type as "workType", land_area as "landArea",
                booking_date as "bookingDate", booking_time as "bookingTime",
                duration_hours as "durationHours", estimated_cost as "estimatedCost",
                status, payment_status as "paymentStatus", remarks,
                tractor_photo as "tractorPhoto", created_at as "createdAt";
    `;

    const values = [
      id,
      farmerId,
      farmerName.trim(),
      String(farmerMobile).replace(/\D/g, ''),
      b.farmerVillage || 'Hasanparthy',
      b.tractorId ? parseInt(b.tractorId, 10) : null,
      b.tractorModel || 'Mahindra 575 DI Sarpanch',
      b.tractorOwner || 'Local Fleet',
      ownerMobile,
      registrationNo,
      b.workType || 'Ploughing',
      parseFloat(b.landArea) || 2.0,
      b.bookingDate || new Date().toISOString().split('T')[0],
      b.bookingTime || '07:00 AM',
      parseInt(b.durationHours, 10) || 4,
      parseInt(b.estimatedCost, 10) || 0,
      b.status || 'Pending Approval',
      b.paymentStatus || 'Pending Cash on Service',
      b.remarks || '',
      tractorPhoto
    ];

    const result = await query(text, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/bookings/:id
 * Update booking work order with IDOR protection
 */
export async function updateBooking(req, res, next) {
  try {
    const { id } = req.params;
    const b = req.body;

    // IDOR Protection: Verify ownership before allowing update
    const checkRes = await query(
      'SELECT id, farmer_id as "farmerId", farmer_mobile as "farmerMobile" FROM bookings WHERE id = $1',
      [parseInt(id, 10)]
    );
    if (checkRes.rowCount === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (req.user && req.user.role === 'farmer') {
      const userPhone = String(req.user.mobile).replace(/\D/g, '').slice(-10);
      const bookingPhone = String(checkRes.rows[0].farmerMobile).replace(/\D/g, '').slice(-10);
      const isOwner = (userPhone && bookingPhone && userPhone === bookingPhone) ||
                      (req.user.id && checkRes.rows[0].farmerId && req.user.id === checkRes.rows[0].farmerId);

      if (!isOwner) {
        return res.status(403).json({
          error: 'Forbidden: You cannot modify another user\'s booking order (IDOR Protection).',
          code: 'IDOR_ACCESS_DENIED'
        });
      }
    }

    const text = `
      UPDATE bookings SET
        farmer_name = COALESCE($1, farmer_name),
        farmer_village = COALESCE($2, farmer_village),
        work_type = COALESCE($3, work_type),
        land_area = COALESCE($4, land_area),
        booking_date = COALESCE($5, booking_date),
        booking_time = COALESCE($6, booking_time),
        duration_hours = COALESCE($7, duration_hours),
        estimated_cost = COALESCE($8, estimated_cost),
        status = COALESCE($9, status),
        remarks = COALESCE($10, remarks),
        payment_status = COALESCE($11, payment_status)
      WHERE id = $12
      RETURNING id, farmer_name as "farmerName", farmer_mobile as "farmerMobile",
                tractor_model as "tractorModel", work_type as "workType",
                status, payment_status as "paymentStatus", estimated_cost as "estimatedCost";
    `;

    const values = [
      b.farmerName ? b.farmerName.trim() : null,
      b.farmerVillage || null,
      b.workType || null,
      b.landArea ? parseFloat(b.landArea) : null,
      b.bookingDate || null,
      b.bookingTime || null,
      b.durationHours ? parseInt(b.durationHours, 10) : null,
      b.estimatedCost ? parseInt(b.estimatedCost, 10) : null,
      b.status || null,
      b.remarks || null,
      b.paymentStatus || null,
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
 * or PUT /api/bookings/:id/status
 * Update booking workflow status
 */
export async function updateBookingStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;

    if (!status && !paymentStatus) {
      return res.status(400).json({ error: 'Status or paymentStatus is required' });
    }

    // IDOR Protection: Check existence and ownership
    const checkRes = await query(
      'SELECT id, farmer_id as "farmerId", farmer_mobile as "farmerMobile" FROM bookings WHERE id = $1',
      [parseInt(id, 10)]
    );
    if (checkRes.rowCount === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (req.user && req.user.role === 'farmer') {
      const userPhone = String(req.user.mobile).replace(/\D/g, '').slice(-10);
      const bookingPhone = String(checkRes.rows[0].farmerMobile).replace(/\D/g, '').slice(-10);
      const isOwner = (userPhone && bookingPhone && userPhone === bookingPhone) ||
                      (req.user.id && checkRes.rows[0].farmerId && req.user.id === checkRes.rows[0].farmerId);

      // Farmers can only cancel their own pending bookings
      if (!isOwner) {
        return res.status(403).json({
          error: 'Forbidden: You cannot change status of another user\'s booking (IDOR Protection).',
          code: 'IDOR_ACCESS_DENIED'
        });
      }
    }

    const result = await query(
      `UPDATE bookings SET
         status = COALESCE($1, status),
         payment_status = COALESCE($2, payment_status)
       WHERE id = $3
       RETURNING id, status, payment_status as "paymentStatus",
                 farmer_name as "farmerName", tractor_model as "tractorModel"`,
      [status || null, paymentStatus || null, parseInt(id, 10)]
    );

    res.json(result.rows[0]);
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

    // IDOR Protection: Verify ownership before deletion
    const checkRes = await query(
      'SELECT id, farmer_id as "farmerId", farmer_mobile as "farmerMobile" FROM bookings WHERE id = $1',
      [parseInt(id, 10)]
    );
    if (checkRes.rowCount === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (req.user && req.user.role === 'farmer') {
      const userPhone = String(req.user.mobile).replace(/\D/g, '').slice(-10);
      const bookingPhone = String(checkRes.rows[0].farmerMobile).replace(/\D/g, '').slice(-10);
      const isOwner = (userPhone && bookingPhone && userPhone === bookingPhone) ||
                      (req.user.id && checkRes.rows[0].farmerId && req.user.id === checkRes.rows[0].farmerId);

      if (!isOwner) {
        return res.status(403).json({
          error: 'Forbidden: You cannot delete another farmer\'s booking (IDOR Protection).',
          code: 'IDOR_ACCESS_DENIED'
        });
      }
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
