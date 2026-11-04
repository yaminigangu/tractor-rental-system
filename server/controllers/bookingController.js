import { query } from '../db.js';

/**
 * GET /api/bookings
 * Retrieve all work order bookings with optional filters
 * Returns: Array of booking objects
 */
export async function getBookings(req, res, next) {
  try {
    const { farmerMobile, tractorId, status, date, village } = req.query;

    let sql = `
      SELECT id, farmer_name as "farmerName", farmer_mobile as "farmerMobile",
             farmer_village as "farmerVillage", tractor_id as "tractorId",
             tractor_model as "tractorModel", tractor_owner as "tractorOwner",
             work_type as "workType", land_area as "landArea",
             booking_date as "bookingDate", booking_time as "bookingTime",
             duration_hours as "durationHours", estimated_cost as "estimatedCost",
             status, remarks, created_at as "createdAt"
      FROM bookings
      WHERE 1=1
    `;
    const params = [];

    if (farmerMobile) {
      const cleanMobile = String(farmerMobile).replace(/\D/g, '');
      params.push(`%${cleanMobile.slice(-10)}`);
      sql += ` AND farmer_mobile LIKE $${params.length}`;
    }

    if (tractorId) {
      params.push(parseInt(tractorId, 10));
      sql += ` AND tractor_id = $${params.length}`;
    }

    if (status && status !== 'All') {
      params.push(status);
      sql += ` AND status = $${params.length}`;
    }

    if (date) {
      params.push(date);
      sql += ` AND booking_date = $${params.length}`;
    }

    if (village) {
      params.push(`%${village.toLowerCase()}%`);
      sql += ` AND LOWER(farmer_village) LIKE $${params.length}`;
    }

    sql += ` ORDER BY id DESC`;

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/bookings/:id
 * Retrieve a specific booking receipt / work slip
 */
export async function getBookingById(req, res, next) {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT id, farmer_name as "farmerName", farmer_mobile as "farmerMobile",
              farmer_village as "farmerVillage", tractor_id as "tractorId",
              tractor_model as "tractorModel", tractor_owner as "tractorOwner",
              work_type as "workType", land_area as "landArea",
              booking_date as "bookingDate", booking_time as "bookingTime",
              duration_hours as "durationHours", estimated_cost as "estimatedCost",
              status, remarks, created_at as "createdAt"
       FROM bookings WHERE id = $1`,
      [parseInt(id, 10)]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Booking work order not found' });
    }

    res.json(result.rows[0]);
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

    const text = `
      INSERT INTO bookings (
        id, farmer_name, farmer_mobile, farmer_village, tractor_id, tractor_model,
        tractor_owner, work_type, land_area, booking_date, booking_time, duration_hours,
        estimated_cost, status, remarks
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id, farmer_name as "farmerName", farmer_mobile as "farmerMobile",
                farmer_village as "farmerVillage", tractor_id as "tractorId",
                tractor_model as "tractorModel", tractor_owner as "tractorOwner",
                work_type as "workType", land_area as "landArea",
                booking_date as "bookingDate", booking_time as "bookingTime",
                duration_hours as "durationHours", estimated_cost as "estimatedCost",
                status, remarks, created_at as "createdAt";
    `;

    const values = [
      id,
      b.farmerName.trim(),
      String(b.farmerMobile || '9876543210').replace(/\D/g, ''),
      b.farmerVillage || 'Hasanparthy',
      b.tractorId ? parseInt(b.tractorId, 10) : null,
      b.tractorModel || 'Mahindra 575 DI Sarpanch',
      b.tractorOwner || 'Local Fleet',
      b.workType || 'Ploughing',
      parseFloat(b.landArea) || 2.0,
      b.bookingDate || new Date().toISOString().split('T')[0],
      b.bookingTime || '07:00 AM',
      parseInt(b.durationHours, 10) || 4,
      parseInt(b.estimatedCost, 10) || 0,
      b.status || 'Pending Approval',
      b.remarks || ''
    ];

    const result = await query(text, values);
    res.status(201).json(result.rows[0]);
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
        remarks = COALESCE($10, remarks)
      WHERE id = $11
      RETURNING id, farmer_name as "farmerName", farmer_mobile as "farmerMobile",
                tractor_model as "tractorModel", work_type as "workType",
                status, estimated_cost as "estimatedCost";
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
      parseInt(id, 10)
    ];

    const result = await query(text, values);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

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
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const result = await query(
      'UPDATE bookings SET status = $1 WHERE id = $2 RETURNING id, status, farmer_name as "farmerName", tractor_model as "tractorModel"',
      [status, parseInt(id, 10)]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/bookings/:id
 * Delete / cancel a booking
 */
export async function deleteBooking(req, res, next) {
  try {
    const { id } = req.params;
    const result = await query(
      'DELETE FROM bookings WHERE id = $1 RETURNING id, farmer_name as "farmerName"',
      [parseInt(id, 10)]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({
      message: `Booking #${id} deleted successfully`,
      deleted: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
}
