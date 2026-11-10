import { query } from '../db.js';
import { createInAppNotification } from './notificationController.js';
import { sendWhatsAppNotification } from '../services/whatsappService.js';

/**
 * GET /api/tractors
 * List all tractors with filtering, search, sorting, and verification gating
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
      sortBy,
      ownerMobile,
      verificationStatus,
      status,
      includeUnverified
    } = req.query;

    let sql = `
      SELECT id, brand, model, hp, equipment, pricing, photo, rating,
             jobs_done as "jobsDone", default_owner as "owner",
             default_owner as "defaultOwner", default_mobile as "mobile",
             default_mobile as "defaultMobile", village_type as "villageType",
             village, district, distance_km as "distanceKm",
             COALESCE(availability, 'Available') as availability,
             created_at as "createdAt",
             owner_id as "ownerId",
             owner_mobile as "ownerMobile",
             owner_name as "ownerName",
             year,
             rc_number as "rcNumber",
             price_per_acre as "priceAcre",
             implements,
             whereabouts,
             COALESCE(verification_status, 'Approved') as "verificationStatus",
             COALESCE(verification_status, 'Approved') as "verification_status",
             admin_remarks as "adminRemarks",
             admin_remarks as "admin_remarks",
             approved_at as "approvedAt"
      FROM tractors
      WHERE 1=1
    `;
    const params = [];

    // Owner specific query - owners can see all their tractors regardless of status
    if (ownerMobile) {
      const cleanMobile = String(ownerMobile).replace(/\D/g, '').slice(-10);
      params.push(`%${cleanMobile}%`);
      sql += ` AND (owner_mobile LIKE $${params.length} OR default_mobile LIKE $${params.length})`;
    } else {
      // For general customer/public fleet, gate by verification status
      const vStatus = verificationStatus || status;
      if (vStatus && vStatus.toLowerCase() !== 'all') {
        params.push(vStatus);
        sql += ` AND LOWER(verification_status) = LOWER($${params.length})`;
      } else if (includeUnverified !== 'true' && vStatus?.toLowerCase() !== 'all') {
        // Customer view: only approved custom & predefined tractors
        sql += ` AND (verification_status IS NULL OR verification_status = 'Approved')`;
      }
    }

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
        LOWER(COALESCE(owner_name, '')) LIKE $${params.length} OR
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
      sql += ` ORDER BY id DESC`;
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
              created_at as "createdAt",
              owner_id as "ownerId",
              owner_mobile as "ownerMobile",
              owner_name as "ownerName",
              year,
              rc_number as "rcNumber",
              price_per_acre as "priceAcre",
              implements,
              whereabouts,
              COALESCE(verification_status, 'Approved') as "verificationStatus",
              COALESCE(verification_status, 'Approved') as "verification_status",
              admin_remarks as "adminRemarks",
              approved_at as "approvedAt"
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
 * POST /api/tractors/custom
 * Register a custom tractor model submitted by an owner for Admin Verification
 */
export async function createCustomTractor(req, res, next) {
  try {
    const b = req.body;
    if (!b.brand || !b.model) {
      return res.status(400).json({ error: 'Tractor Brand Name and Model are required.' });
    }
    if (!b.photo) {
      return res.status(400).json({ error: 'Actual Tractor Photograph upload is mandatory.' });
    }

    // Determine ID starting above standard fleet (> 20)
    const maxIdRes = await query('SELECT COALESCE(MAX(id), 20) as max_id FROM tractors');
    const nextId = Math.max(parseInt(maxIdRes.rows[0].max_id, 10) + 1, 101);

    const implementsArr = Array.isArray(b.implements) ? b.implements : (typeof b.implements === 'string' ? b.implements.split(',').map(s => s.trim()) : []);
    const equipmentStr = implementsArr.length > 0 ? implementsArr.join(', ') : (b.equipment || 'Ploughing, Rotavator');

    const cleanMobile = String(b.ownerMobile || b.mobile || '9876543210').replace(/\D/g, '');
    const ownerName = (b.ownerName || b.owner || 'Vehicle Owner').trim();
    const hpStr = b.hp ? (String(b.hp).toUpperCase().includes('HP') ? String(b.hp) : `${b.hp} HP`) : '48 HP';

    const text = `
      INSERT INTO tractors (
        id, brand, model, hp, equipment, pricing, photo, rating,
        jobs_done, default_owner, default_mobile, village_type,
        village, district, distance_km, availability,
        owner_id, owner_mobile, owner_name, year, rc_number,
        price_per_acre, implements, whereabouts, verification_status,
        admin_remarks
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12,
        $13, $14, $15, $16,
        $17, $18, $19, $20, $21,
        $22, $23, $24, $25,
        $26
      )
      RETURNING id, brand, model, hp, equipment, pricing, photo, rating,
                jobs_done as "jobsDone", default_owner as "owner",
                default_mobile as "mobile", village, district, distance_km as "distanceKm",
                availability, owner_name as "ownerName", owner_mobile as "ownerMobile",
                year, rc_number as "rcNumber", price_per_acre as "priceAcre",
                implements, whereabouts, verification_status as "verificationStatus",
                verification_status, admin_remarks as "adminRemarks",
                created_at as "createdAt";
    `;

    const values = [
      nextId,
      b.brand.trim(),
      b.model.trim(),
      hpStr,
      equipmentStr,
      parseInt(b.priceHour || b.pricing || 900, 10),
      b.photo,
      5.0,
      0,
      ownerName,
      cleanMobile,
      'custom',
      b.mandal || b.village || 'Hasanparthy',
      b.district || 'Hanamkonda',
      1.2,
      'Available',
      b.ownerId ? parseInt(b.ownerId, 10) : null,
      cleanMobile,
      ownerName,
      b.year || '2023',
      (b.rcNumber || '').toUpperCase().trim(),
      parseInt(b.priceAcre || 1800, 10),
      JSON.stringify(implementsArr),
      b.whereabouts || 'Local Village Shed',
      'Pending Verification',
      null
    ];

    const result = await query(text, values);
    const createdTractor = result.rows[0];

    // Create In-App Notification for Owner
    await createInAppNotification({
      userMobile: cleanMobile,
      userRole: 'owner',
      title: '📋 Custom Tractor Submitted for Verification',
      message: `Your tractor ${createdTractor.brand} ${createdTractor.model} (Listing ID: TRAC-CUSTOM-${createdTractor.id}) has been submitted for administrator verification. Status: Pending Verification.`,
      type: 'tractor_verification'
    });

    // Create In-App Notification for Admin
    await createInAppNotification({
      userMobile: '9999999999',
      userRole: 'admin',
      title: '🚜 New Custom Tractor Submitted',
      message: `Owner ${ownerName} (+91 ${cleanMobile}) submitted a custom tractor: ${createdTractor.brand} ${createdTractor.model} (${hpStr}) awaiting your review and approval.`,
      type: 'tractor_verification'
    });

    res.status(201).json({
      success: true,
      message: 'Custom tractor model submitted successfully for Administrator verification.',
      listingId: `TRAC-CUSTOM-${createdTractor.id}`,
      tractor: createdTractor
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/tractors/:id/verification
 * Admin Approve, Reject, or Request Resubmission for a Custom Tractor
 */
export async function updateTractorVerification(req, res, next) {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    const validStatuses = ['Pending Verification', 'Approved', 'Rejected', 'Resubmission Required'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid verification status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    if ((status === 'Rejected' || status === 'Resubmission Required') && (!remarks || !remarks.trim())) {
      return res.status(400).json({
        error: 'Administrator feedback/remarks are mandatory when rejecting or requesting resubmission.'
      });
    }

    const currentTractorRes = await query('SELECT * FROM tractors WHERE id = $1', [parseInt(id, 10)]);
    if (currentTractorRes.rowCount === 0) {
      return res.status(404).json({ error: 'Tractor not found' });
    }
    const currentTractor = currentTractorRes.rows[0];

    const isApproved = status === 'Approved';
    const text = `
      UPDATE tractors SET
        verification_status = $1,
        admin_remarks = $2,
        approved_at = CASE WHEN $4 THEN CURRENT_TIMESTAMP ELSE approved_at END
      WHERE id = $3
      RETURNING id, brand, model, hp, equipment, pricing, photo, rating,
                default_owner as "owner", default_mobile as "mobile",
                owner_name as "ownerName", owner_mobile as "ownerMobile",
                village, district, verification_status as "verificationStatus",
                verification_status, admin_remarks as "adminRemarks",
                approved_at as "approvedAt";
    `;

    const values = [status, remarks || null, parseInt(id, 10), isApproved];
    const result = await query(text, values);
    const updatedTractor = result.rows[0];

    const ownerPhone = updatedTractor.ownerMobile || updatedTractor.mobile || currentTractor.owner_mobile || currentTractor.default_mobile;
    const tractorTitle = `${updatedTractor.brand} ${updatedTractor.model}`.trim();

    // In-App Notification and WhatsApp Dispatch to Owner
    if (status === 'Approved') {
      const msg = `Congratulations! Your tractor ${tractorTitle} has been successfully verified and approved. Your tractor is now available for customers to view and book.`;
      await createInAppNotification({
        userMobile: ownerPhone,
        userRole: 'owner',
        title: '🎉 Tractor Listing Approved!',
        message: msg,
        type: 'tractor_verification'
      });

      sendWhatsAppNotification({
        recipientPhone: ownerPhone,
        type: 'tractor_approved_to_owner',
        booking: {
          brand: updatedTractor.brand,
          model: updatedTractor.model,
          adminRemarks: remarks
        }
      }).catch(e => console.warn('WhatsApp dispatch warning:', e));

    } else if (status === 'Rejected') {
      const msg = `Your tractor listing (${tractorTitle}) needs some corrections. Reason: ${remarks}. Please check the administrator's feedback and upload the required information again.`;
      await createInAppNotification({
        userMobile: ownerPhone,
        userRole: 'owner',
        title: '❌ Tractor Verification Rejected',
        message: msg,
        type: 'tractor_verification'
      });

      sendWhatsAppNotification({
        recipientPhone: ownerPhone,
        type: 'tractor_rejected_to_owner',
        booking: {
          brand: updatedTractor.brand,
          model: updatedTractor.model,
          adminRemarks: remarks
        }
      }).catch(e => console.warn('WhatsApp dispatch warning:', e));

    } else if (status === 'Resubmission Required') {
      const msg = `Your tractor listing (${tractorTitle}) requires updates. Admin feedback: ${remarks}. Please edit your details and submit again.`;
      await createInAppNotification({
        userMobile: ownerPhone,
        userRole: 'owner',
        title: '🔄 Tractor Resubmission Required',
        message: msg,
        type: 'tractor_verification'
      });

      sendWhatsAppNotification({
        recipientPhone: ownerPhone,
        type: 'tractor_resubmit_to_owner',
        booking: {
          brand: updatedTractor.brand,
          model: updatedTractor.model,
          adminRemarks: remarks
        }
      }).catch(e => console.warn('WhatsApp dispatch warning:', e));
    }

    res.json({
      success: true,
      message: `Tractor verification status updated to '${status}' successfully.`,
      tractor: updatedTractor
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/tractors/:id/custom
 * Allow an owner to edit and resubmit their custom tractor
 */
export async function resubmitCustomTractor(req, res, next) {
  try {
    const { id } = req.params;
    const b = req.body;

    const implementsArr = Array.isArray(b.implements) ? b.implements : (typeof b.implements === 'string' ? b.implements.split(',').map(s => s.trim()) : []);
    const equipmentStr = implementsArr.length > 0 ? implementsArr.join(', ') : b.equipment;
    const hpStr = b.hp ? (String(b.hp).toUpperCase().includes('HP') ? String(b.hp) : `${b.hp} HP`) : undefined;

    const text = `
      UPDATE tractors SET
        brand = COALESCE($1, brand),
        model = COALESCE($2, model),
        hp = COALESCE($3, hp),
        equipment = COALESCE($4, equipment),
        pricing = COALESCE($5, pricing),
        photo = COALESCE($6, photo),
        year = COALESCE($7, year),
        rc_number = COALESCE($8, rc_number),
        price_per_acre = COALESCE($9, price_per_acre),
        implements = COALESCE($10, implements),
        whereabouts = COALESCE($11, whereabouts),
        village = COALESCE($12, village),
        district = COALESCE($13, district),
        verification_status = 'Pending Verification',
        admin_remarks = NULL
      WHERE id = $14
      RETURNING id, brand, model, hp, equipment, pricing, photo, rating,
                default_owner as "owner", default_mobile as "mobile",
                owner_name as "ownerName", owner_mobile as "ownerMobile",
                year, rc_number as "rcNumber", price_per_acre as "priceAcre",
                implements, whereabouts, village, district,
                verification_status as "verificationStatus",
                verification_status, admin_remarks as "adminRemarks";
    `;

    const values = [
      b.brand || null,
      b.model || null,
      hpStr || null,
      equipmentStr || null,
      b.priceHour ? parseInt(b.priceHour, 10) : (b.pricing ? parseInt(b.pricing, 10) : null),
      b.photo || null,
      b.year || null,
      b.rcNumber ? String(b.rcNumber).toUpperCase().trim() : null,
      b.priceAcre ? parseInt(b.priceAcre, 10) : null,
      implementsArr.length > 0 ? JSON.stringify(implementsArr) : null,
      b.whereabouts || null,
      b.mandal || b.village || null,
      b.district || null,
      parseInt(id, 10)
    ];

    const result = await query(text, values);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Tractor not found' });
    }

    const updated = result.rows[0];

    // Notify Admin of resubmission
    await createInAppNotification({
      userMobile: '9999999999',
      userRole: 'admin',
      title: '🔄 Custom Tractor Resubmitted',
      message: `Owner resubmitted tractor ${updated.brand} ${updated.model} (ID: ${updated.id}) for verification.`,
      type: 'tractor_verification'
    });

    res.json({
      success: true,
      message: 'Tractor listing updated and resubmitted for verification.',
      tractor: updated
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/tractors
 * Add a new tractor to the fleet (Standard admin/system)
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
        village, district, distance_km, availability, verification_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'Approved')
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
                availability, verification_status as "verificationStatus";
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
                village, district, availability, verification_status as "verificationStatus";
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
