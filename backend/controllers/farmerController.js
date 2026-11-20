import { query } from '../db.js';

/**
 * GET /api/farmers
 * Retrieve all registered farmers
 * Returns: Array of farmers
 */
export async function getFarmers(req, res, next) {
  try {
    const { village, district, search } = req.query;
    let sql = `
      SELECT id, name, mobile, email, village, district, land_area as "landArea",
             crops, passbook_no as "passbookNo", is_verified as "isVerified",
             COALESCE(role, 'FARMER') as role, COALESCE(is_active, TRUE) as "isActive",
             registered_at as "registeredAt", created_at as "createdAt"
      FROM farmers
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
    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      sql += ` AND (LOWER(name) LIKE $${params.length} OR mobile LIKE $${params.length} OR LOWER(village) LIKE $${params.length})`;
    }

    sql += ` ORDER BY id DESC`;

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/farmers/:mobile
 * Look up farmer by mobile number to check existing status
 */
export async function getFarmerByMobile(req, res, next) {
  try {
    const { mobile } = req.params;
    const cleanMobile = String(mobile).replace(/\D/g, '');

    if (!cleanMobile || cleanMobile.length < 10) {
      return res.status(400).json({ error: 'Valid 10-digit mobile number is required' });
    }

    const last10 = cleanMobile.slice(-10);
    const result = await query(
      `SELECT id, name, mobile, village, district, land_area as "landArea",
              crops, passbook_no as "passbookNo", is_verified as "isVerified",
              registered_at as "registeredAt", created_at as "createdAt"
       FROM farmers
       WHERE mobile = $1 OR mobile LIKE $2
       LIMIT 1`,
      [cleanMobile, `%${last10}`]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: `Farmer with mobile ${cleanMobile} is not registered in the database`,
        registered: false
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/farmers
 * Register a new farmer or update existing record on mobile conflict
 */
export async function createOrUpdateFarmer(req, res, next) {
  try {
    const { name, mobile, village, district, landArea, crops, passbookNo, isVerified, registeredAt } = req.body;

    if (!name || !mobile) {
      return res.status(400).json({ error: 'Name and mobile number are required' });
    }

    const cleanMobile = String(mobile).replace(/\D/g, '');
    if (cleanMobile.length < 10) {
      return res.status(400).json({ error: 'Please provide a valid 10-digit mobile number' });
    }

    const text = `
      INSERT INTO farmers (name, mobile, village, district, land_area, crops, passbook_no, is_verified, registered_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (mobile) DO UPDATE SET
        name = EXCLUDED.name,
        village = COALESCE(EXCLUDED.village, farmers.village),
        district = COALESCE(EXCLUDED.district, farmers.district),
        land_area = COALESCE(EXCLUDED.land_area, farmers.land_area),
        crops = COALESCE(EXCLUDED.crops, farmers.crops),
        passbook_no = COALESCE(EXCLUDED.passbook_no, farmers.passbook_no),
        is_verified = EXCLUDED.is_verified
      RETURNING id, name, mobile, village, district, land_area as "landArea",
                crops, passbook_no as "passbookNo", is_verified as "isVerified",
                registered_at as "registeredAt";
    `;

    const values = [
      name.trim(),
      cleanMobile,
      village || 'Hasanparthy',
      district || 'Hanamkonda',
      parseFloat(landArea) || 3.0,
      Array.isArray(crops) ? crops : ['Paddy', 'Cotton'],
      passbookNo || null,
      isVerified !== undefined ? isVerified : true,
      registeredAt || new Date().toISOString().split('T')[0]
    ];

    const result = await query(text, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/farmers/:mobile
 * Update farmer profile
 */
export async function updateFarmer(req, res, next) {
  try {
    const { mobile } = req.params;
    const cleanMobile = String(mobile).replace(/\D/g, '');
    const { name, village, district, landArea, crops, passbookNo, isVerified } = req.body;

    const text = `
      UPDATE farmers SET
        name = COALESCE($1, name),
        village = COALESCE($2, village),
        district = COALESCE($3, district),
        land_area = COALESCE($4, land_area),
        crops = COALESCE($5, crops),
        passbook_no = COALESCE($6, passbook_no),
        is_verified = COALESCE($7, is_verified)
      WHERE mobile = $8 OR mobile LIKE $9
      RETURNING id, name, mobile, village, district, land_area as "landArea",
                crops, passbook_no as "passbookNo", is_verified as "isVerified",
                registered_at as "registeredAt";
    `;

    const values = [
      name ? name.trim() : null,
      village || null,
      district || null,
      landArea ? parseFloat(landArea) : null,
      crops && Array.isArray(crops) ? crops : null,
      passbookNo || null,
      isVerified !== undefined ? isVerified : null,
      cleanMobile,
      `%${cleanMobile.slice(-10)}`
    ];

    const result = await query(text, values);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Farmer not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/farmers/:mobile
 * Delete a farmer account completely
 */
export async function deleteFarmer(req, res, next) {
  try {
    const { mobile } = req.params;
    const cleanMobile = String(mobile).replace(/\D/g, '');

    const result = await query(
      'DELETE FROM farmers WHERE mobile = $1 OR mobile LIKE $2 RETURNING mobile, name',
      [cleanMobile, `%${cleanMobile.slice(-10)}`]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Farmer not found in database' });
    }

    res.json({
      message: `Farmer "${result.rows[0].name}" permanently deleted from database`,
      deleted: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/farmers/:id/status
 * Toggle or set farmer active status (Admin only)
 */
export async function toggleFarmerStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const result = await query(
      `UPDATE farmers
       SET is_active = COALESCE($1, NOT is_active)
       WHERE id = $2
       RETURNING id, name, mobile, is_active as "isActive", role`,
      [isActive !== undefined ? Boolean(isActive) : null, parseInt(id, 10)]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Farmer not found' });
    }

    res.json({
      success: true,
      message: `Farmer account ${result.rows[0].isActive ? 'activated' : 'deactivated'} successfully.`,
      farmer: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
}

