import { query } from '../db.js';

/**
 * GET /api/owners
 * Retrieve all registered vehicle owners / captains
 * Returns: Array of owners
 */
export async function getOwners(req, res, next) {
  try {
    const { village, district, vehicleType, search } = req.query;

    let sql = `
      SELECT id, full_name as "fullName", full_name as "owner", mobile, dob, gender,
             referral_code as "referralCode", vehicle_type as "vehicleType",
             tractor_model as "tractorModel", vehicle_number as "vehicleNumber",
             pricing, village, district, dl_number as "dlNumber", rc_number as "rcNumber",
             aadhaar_number as "aadhaarNumber", bank_account as "bankAccount",
             ifsc_code as "ifscCode", upi_id as "upiId", photo, selfie_photo as "selfiePhoto",
             is_verified as "isVerified", COALESCE(role, 'VEHICLE_OWNER') as role, COALESCE(is_active, TRUE) as "isActive",
             registered_at as "registeredAt", created_at as "createdAt"
      FROM vehicle_owners
      WHERE 1=1
    `;
    const params = [];

    if (village) {
      params.push(`%${village.toLowerCase()}%`);
      sql += ` AND LOWER(village) LIKE $${params.length}`;
    }
    if (district) {
      params.push(`%${district.toLowerCase()}%`);
      sql += ` AND LOWER(district) LIKE $${params.length}`;
    }
    if (vehicleType) {
      params.push(vehicleType);
      sql += ` AND vehicle_type = $${params.length}`;
    }
    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      sql += ` AND (LOWER(full_name) LIKE $${params.length} OR mobile LIKE $${params.length} OR LOWER(tractor_model) LIKE $${params.length})`;
    }

    sql += ` ORDER BY id DESC`;

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/owners/:mobile
 * Look up owner by mobile number
 */
export async function getOwnerByMobile(req, res, next) {
  try {
    const { mobile } = req.params;
    const cleanMobile = String(mobile).replace(/\D/g, '');

    const result = await query(
      `SELECT id, full_name as "fullName", full_name as "owner", mobile, dob, gender,
              referral_code as "referralCode", vehicle_type as "vehicleType",
              tractor_model as "tractorModel", vehicle_number as "vehicleNumber",
              pricing, village, district, dl_number as "dlNumber", rc_number as "rcNumber",
              aadhaar_number as "aadhaarNumber", bank_account as "bankAccount",
              ifsc_code as "ifscCode", upi_id as "upiId", photo, selfie_photo as "selfiePhoto",
              is_verified as "isVerified", registered_at as "registeredAt", created_at as "createdAt"
       FROM vehicle_owners
       WHERE mobile = $1 OR mobile LIKE $2
       LIMIT 1`,
      [cleanMobile, `%${cleanMobile.slice(-10)}`]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Vehicle owner not found', registered: false });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/owners
 * Register a new vehicle owner or update on mobile conflict
 */
export async function createOrUpdateOwner(req, res, next) {
  try {
    const b = req.body;
    const fullName = b.fullName || b.owner;
    const mobile = b.mobile;

    if (!fullName || !mobile) {
      return res.status(400).json({ error: 'Full name and mobile number are required' });
    }

    const cleanMobile = String(mobile).replace(/\D/g, '');
    if (cleanMobile.length < 10) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number' });
    }

    const text = `
      INSERT INTO vehicle_owners (
        full_name, mobile, dob, gender, referral_code, vehicle_type, tractor_model,
        vehicle_number, pricing, village, district, dl_number, rc_number, aadhaar_number,
        bank_account, ifsc_code, upi_id, photo, selfie_photo, is_verified, registered_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      ON CONFLICT (mobile) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        vehicle_type = EXCLUDED.vehicle_type,
        tractor_model = EXCLUDED.tractor_model,
        vehicle_number = EXCLUDED.vehicle_number,
        pricing = EXCLUDED.pricing,
        village = EXCLUDED.village,
        district = EXCLUDED.district,
        rc_number = EXCLUDED.rc_number,
        is_verified = EXCLUDED.is_verified
      RETURNING id, full_name as "fullName", full_name as "owner", mobile, vehicle_type as "vehicleType",
                tractor_model as "tractorModel", vehicle_number as "vehicleNumber", pricing,
                village, district, rc_number as "rcNumber", is_verified as "isVerified";
    `;

    const values = [
      fullName.trim(),
      cleanMobile,
      b.dob || null,
      b.gender || 'Male',
      b.referralCode || null,
      b.vehicleType || 'Tractor',
      b.tractorModel || 'Mahindra 575 DI Sarpanch',
      b.vehicleNumber || 'TS 04 AB 1234',
      parseInt(b.pricing, 10) || 1200,
      b.village || 'Hasanparthy',
      b.district || 'Hanamkonda',
      b.dlNumber || null,
      b.rcNumber || null,
      b.aadhaarNumber || null,
      b.bankAccount || null,
      b.ifscCode || null,
      b.upiId || null,
      b.photo || '/images/mahindra_575.jpg',
      b.selfiePhoto || null,
      b.isVerified !== undefined ? b.isVerified : true,
      b.registeredAt || new Date().toISOString().split('T')[0]
    ];

    const result = await query(text, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/owners/:mobile
 * Update vehicle owner profile
 */
export async function updateOwner(req, res, next) {
  try {
    const { mobile } = req.params;
    const cleanMobile = String(mobile).replace(/\D/g, '');
    const b = req.body;

    const text = `
      UPDATE vehicle_owners SET
        full_name = COALESCE($1, full_name),
        vehicle_type = COALESCE($2, vehicle_type),
        tractor_model = COALESCE($3, tractor_model),
        vehicle_number = COALESCE($4, vehicle_number),
        pricing = COALESCE($5, pricing),
        village = COALESCE($6, village),
        district = COALESCE($7, district),
        rc_number = COALESCE($8, rc_number),
        dl_number = COALESCE($9, dl_number),
        upi_id = COALESCE($10, upi_id),
        is_verified = COALESCE($11, is_verified)
      WHERE mobile = $12 OR mobile LIKE $13
      RETURNING id, full_name as "fullName", mobile, vehicle_type as "vehicleType",
                tractor_model as "tractorModel", vehicle_number as "vehicleNumber",
                pricing, village, district, is_verified as "isVerified";
    `;

    const values = [
      b.fullName || b.owner || null,
      b.vehicleType || null,
      b.tractorModel || null,
      b.vehicleNumber || null,
      b.pricing ? parseInt(b.pricing, 10) : null,
      b.village || null,
      b.district || null,
      b.rcNumber || null,
      b.dlNumber || null,
      b.upiId || null,
      b.isVerified !== undefined ? b.isVerified : null,
      cleanMobile,
      `%${cleanMobile.slice(-10)}`
    ];

    const result = await query(text, values);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Vehicle owner not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/owners/:mobile
 * Delete a vehicle owner account
 */
export async function deleteOwner(req, res, next) {
  try {
    const { mobile } = req.params;
    const cleanMobile = String(mobile).replace(/\D/g, '');

    const result = await query(
      'DELETE FROM vehicle_owners WHERE mobile = $1 OR mobile LIKE $2 RETURNING mobile, full_name',
      [cleanMobile, `%${cleanMobile.slice(-10)}`]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Owner not found in database' });
    }

    res.json({
      message: `Vehicle owner "${result.rows[0].full_name}" permanently deleted from database`,
      deleted: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/owners/:id/status
 * Toggle or set owner active status (Admin only)
 */
export async function toggleOwnerStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const result = await query(
      `UPDATE vehicle_owners
       SET is_active = COALESCE($1, NOT is_active)
       WHERE id = $2
       RETURNING id, full_name as "fullName", mobile, is_active as "isActive", role`,
      [isActive !== undefined ? Boolean(isActive) : null, parseInt(id, 10)]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Vehicle owner not found' });
    }

    res.json({
      success: true,
      message: `Vehicle owner account ${result.rows[0].isActive ? 'activated' : 'deactivated'} successfully.`,
      owner: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
}
