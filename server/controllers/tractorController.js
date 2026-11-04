import { query } from '../db.js';

/**
 * GET /api/tractors
 * List all tractors with filtering, search, and sorting
 * Returns: Array of tractor objects
 */
export async function getTractors(req, res, next) {
  try {
    const {
      brand,
      service,
      equipment,
      village,
      district,
      search,
      minPrice,
      maxPrice,
      availability,
      sortBy
    } = req.query;

    let sql = `
      SELECT id, brand, model, hp, equipment, pricing, photo, rating,
             jobs_done as "jobsDone", default_owner as "owner",
             default_owner as "defaultOwner", default_mobile as "mobile",
             default_mobile as "defaultMobile", village_type as "villageType",
             village, district, distance_km as "distanceKm",
             COALESCE(availability, 'Available') as availability,
             created_at as "createdAt"
      FROM tractors
      WHERE 1=1
    `;
    const params = [];

    if (brand && brand !== 'All') {
      params.push(`%${brand.toLowerCase()}%`);
      sql += ` AND LOWER(brand) LIKE $${params.length}`;
    }

    const activeService = service || equipment;
    if (activeService && activeService !== 'All') {
      params.push(`%${activeService.toLowerCase()}%`);
      sql += ` AND (LOWER(equipment) LIKE $${params.length} OR LOWER(model) LIKE $${params.length})`;
    }

    if (village) {
      params.push(`%${village.toLowerCase()}%`);
      sql += ` AND LOWER(village) LIKE $${params.length}`;
    }
    if (district) {
      params.push(`%${district.toLowerCase()}%`);
      sql += ` AND LOWER(district) LIKE $${params.length}`;
    }

    if (availability) {
      params.push(availability);
      sql += ` AND availability = $${params.length}`;
    }

    if (minPrice) {
      params.push(parseInt(minPrice, 10));
      sql += ` AND pricing >= $${params.length}`;
    }
    if (maxPrice) {
      params.push(parseInt(maxPrice, 10));
      sql += ` AND pricing <= $${params.length}`;
    }

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      sql += ` AND (
        LOWER(model) LIKE $${params.length} OR
        LOWER(brand) LIKE $${params.length} OR
        LOWER(equipment) LIKE $${params.length} OR
        LOWER(default_owner) LIKE $${params.length} OR
        LOWER(village) LIKE $${params.length}
      )`;
    }

    if (sortBy === 'price-low') {
      sql += ` ORDER BY pricing ASC`;
    } else if (sortBy === 'price-high') {
      sql += ` ORDER BY pricing DESC`;
    } else if (sortBy === 'rating') {
      sql += ` ORDER BY rating DESC`;
    } else {
      sql += ` ORDER BY distance_km ASC, id ASC`;
    }

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/tractors/:id
 * Retrieve a specific tractor by ID
 */
export async function getTractorById(req, res, next) {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT id, brand, model, hp, equipment, pricing, photo, rating,
              jobs_done as "jobsDone", default_owner as "owner",
              default_owner as "defaultOwner", default_mobile as "mobile",
              default_mobile as "defaultMobile", village_type as "villageType",
              village, district, distance_km as "distanceKm",
              COALESCE(availability, 'Available') as availability,
              created_at as "createdAt"
       FROM tractors WHERE id = $1`,
      [parseInt(id, 10)]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Tractor not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/tractors
 * Add a new tractor to the fleet
 */
export async function createTractor(req, res, next) {
  try {
    const b = req.body;
    if (!b.brand || !b.model) {
      return res.status(400).json({ error: 'Brand and Model are required' });
    }

    let id = b.id ? parseInt(b.id, 10) : null;
    if (!id) {
      const maxIdRes = await query('SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM tractors');
      id = maxIdRes.rows[0].next_id;
    }

    const text = `
      INSERT INTO tractors (
        id, brand, model, hp, equipment, pricing, photo, rating,
        jobs_done, default_owner, default_mobile, village_type,
        village, district, distance_km, availability
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      ON CONFLICT (id) DO UPDATE SET
        brand = EXCLUDED.brand,
        model = EXCLUDED.model,
        hp = EXCLUDED.hp,
        equipment = EXCLUDED.equipment,
        pricing = EXCLUDED.pricing,
        photo = EXCLUDED.photo,
        default_owner = EXCLUDED.default_owner,
        default_mobile = EXCLUDED.default_mobile,
        village = EXCLUDED.village,
        district = EXCLUDED.district,
        availability = EXCLUDED.availability
      RETURNING id, brand, model, hp, equipment, pricing, photo, rating,
                jobs_done as "jobsDone", default_owner as "owner",
                default_mobile as "mobile", village, district, distance_km as "distanceKm",
                availability;
    `;

    const values = [
      id,
      b.brand.trim(),
      b.model.trim(),
      b.hp || '48 HP',
      b.equipment || 'Ploughing, Rotavator, Cultivator',
      parseInt(b.pricing || b.priceHour, 10) || 1200,
      b.photo || '/tractor1.jpeg',
      parseFloat(b.rating) || 5.0,
      parseInt(b.jobsDone, 10) || 0,
      (b.owner || b.defaultOwner || 'Local Fleet Owner').trim(),
      String(b.mobile || b.defaultMobile || '9876543210').replace(/\D/g, ''),
      b.villageType || 'local',
      b.village || 'Hasanparthy',
      b.district || 'Hanamkonda',
      parseFloat(b.distanceKm) || 1.0,
      b.availability || 'Available'
    ];

    const result = await query(text, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/tractors/:id
 * Update an existing tractor
 */
export async function updateTractor(req, res, next) {
  try {
    const { id } = req.params;
    const b = req.body;

    const text = `
      UPDATE tractors SET
        brand = COALESCE($1, brand),
        model = COALESCE($2, model),
        hp = COALESCE($3, hp),
        equipment = COALESCE($4, equipment),
        pricing = COALESCE($5, pricing),
        photo = COALESCE($6, photo),
        default_owner = COALESCE($7, default_owner),
        default_mobile = COALESCE($8, default_mobile),
        village = COALESCE($9, village),
        district = COALESCE($10, district),
        availability = COALESCE($11, availability)
      WHERE id = $12
      RETURNING id, brand, model, hp, equipment, pricing, photo, rating,
                default_owner as "owner", default_mobile as "mobile",
                village, district, availability;
    `;

    const values = [
      b.brand || null,
      b.model || null,
      b.hp || null,
      b.equipment || null,
      b.pricing ? parseInt(b.pricing, 10) : null,
      b.photo || null,
      b.owner || b.defaultOwner || null,
      b.mobile ? String(b.mobile).replace(/\D/g, '') : null,
      b.village || null,
      b.district || null,
      b.availability || null,
      parseInt(id, 10)
    ];

    const result = await query(text, values);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Tractor not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/tractors/:id
 * Remove a tractor from fleet
 */
export async function deleteTractor(req, res, next) {
  try {
    const { id } = req.params;
    const result = await query(
      'DELETE FROM tractors WHERE id = $1 RETURNING id, brand, model',
      [parseInt(id, 10)]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Tractor not found' });
    }

    res.json({
      message: 'Tractor removed from fleet',
      deleted: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
}
