import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, query } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ---------------------------------------------------------------------
// HEALTH CHECK
// ---------------------------------------------------------------------
app.get('/api/health', async (req, res) => {
  try {
    const dbRes = await query('SELECT NOW() as current_time, current_database() as db_name');
    res.json({
      status: 'ok',
      database: 'connected',
      dbName: dbRes.rows[0].db_name,
      timestamp: dbRes.rows[0].current_time,
    });
  } catch (err) {
    res.status(503).json({
      status: 'degraded',
      database: 'disconnected',
      error: err.message,
    });
  }
});

// ---------------------------------------------------------------------
// FARMERS API
// ---------------------------------------------------------------------

// Get all registered farmers
app.get('/api/farmers', async (req, res) => {
  try {
    const result = await query(
      'SELECT id, name, mobile, village, district, land_area as "landArea", crops, passbook_no as "passbookNo", is_verified as "isVerified", registered_at as "registeredAt" FROM farmers ORDER BY id DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching farmers:', err);
    res.status(500).json({ error: 'Failed to retrieve farmers from database' });
  }
});

// Get single farmer by mobile
app.get('/api/farmers/:mobile', async (req, res) => {
  const { mobile } = req.params;
  const cleanMobile = String(mobile).replace(/\D/g, '');
  try {
    const result = await query(
      'SELECT id, name, mobile, village, district, land_area as "landArea", crops, passbook_no as "passbookNo", is_verified as "isVerified", registered_at as "registeredAt" FROM farmers WHERE mobile = $1 OR mobile LIKE $2',
      [cleanMobile, `%${cleanMobile.slice(-10)}`]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Farmer not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching farmer by mobile:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// Register or update a farmer
app.post('/api/farmers', async (req, res) => {
  const { name, mobile, village, district, landArea, crops, passbookNo, isVerified, registeredAt } = req.body;
  if (!name || !mobile) {
    return res.status(400).json({ error: 'Name and mobile number are required' });
  }

  const cleanMobile = String(mobile).replace(/\D/g, '');

  try {
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
      RETURNING id, name, mobile, village, district, land_area as "landArea", crops, passbook_no as "passbookNo", is_verified as "isVerified", registered_at as "registeredAt";
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
    console.error('Error saving farmer to PostgreSQL:', err);
    res.status(500).json({ error: 'Failed to save farmer to PostgreSQL database' });
  }
});

// Delete a farmer
app.delete('/api/farmers/:mobile', async (req, res) => {
  const { mobile } = req.params;
  const cleanMobile = String(mobile).replace(/\D/g, '');
  try {
    const result = await query(
      'DELETE FROM farmers WHERE mobile = $1 OR mobile LIKE $2 RETURNING mobile, name',
      [cleanMobile, `%${cleanMobile.slice(-10)}`]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Farmer not found in database' });
    }
    res.json({ message: 'Farmer permanently deleted', deleted: result.rows[0] });
  } catch (err) {
    console.error('Error deleting farmer:', err);
    res.status(500).json({ error: 'Failed to delete farmer' });
  }
});

// ---------------------------------------------------------------------
// VEHICLE OWNERS API
// ---------------------------------------------------------------------

// Get all registered vehicle owners
app.get('/api/owners', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, full_name as "fullName", full_name as "owner", mobile, dob, gender, referral_code as "referralCode",
              vehicle_type as "vehicleType", tractor_model as "tractorModel", vehicle_number as "vehicleNumber",
              pricing, village, district, dl_number as "dlNumber", rc_number as "rcNumber",
              aadhaar_number as "aadhaarNumber", bank_account as "bankAccount", ifsc_code as "ifscCode",
              upi_id as "upiId", photo, selfie_photo as "selfiePhoto", is_verified as "isVerified",
              registered_at as "registeredAt"
       FROM vehicle_owners ORDER BY id DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching vehicle owners:', err);
    res.status(500).json({ error: 'Failed to retrieve owners from database' });
  }
});

// Register or update a vehicle owner
app.post('/api/owners', async (req, res) => {
  const b = req.body;
  const fullName = b.fullName || b.owner;
  const mobile = b.mobile;

  if (!fullName || !mobile) {
    return res.status(400).json({ error: 'Full name and mobile are required' });
  }

  const cleanMobile = String(mobile).replace(/\D/g, '');

  try {
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
      RETURNING *;
    `;
    const values = [
      fullName.trim(),
      cleanMobile,
      b.dob || null,
      b.gender || 'Male',
      b.referralCode || null,
      b.vehicleType || 'Tractor',
      b.tractorModel || 'Mahindra 575 DI XP Plus',
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
    console.error('Error saving owner to PostgreSQL:', err);
    res.status(500).json({ error: 'Failed to save owner to database' });
  }
});

// Delete a vehicle owner
app.delete('/api/owners/:mobile', async (req, res) => {
  const { mobile } = req.params;
  const cleanMobile = String(mobile).replace(/\D/g, '');
  try {
    const result = await query(
      'DELETE FROM vehicle_owners WHERE mobile = $1 OR mobile LIKE $2 RETURNING mobile, full_name',
      [cleanMobile, `%${cleanMobile.slice(-10)}`]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Owner not found in database' });
    }
    res.json({ message: 'Owner permanently deleted', deleted: result.rows[0] });
  } catch (err) {
    console.error('Error deleting owner:', err);
    res.status(500).json({ error: 'Failed to delete owner' });
  }
});

// ---------------------------------------------------------------------
// BOOKINGS API
// ---------------------------------------------------------------------

// Get all bookings
app.get('/api/bookings', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, farmer_name as "farmerName", farmer_mobile as "farmerMobile", farmer_village as "farmerVillage",
              tractor_id as "tractorId", tractor_model as "tractorModel", tractor_owner as "tractorOwner",
              work_type as "workType", land_area as "landArea", booking_date as "bookingDate",
              booking_time as "bookingTime", duration_hours as "durationHours", estimated_cost as "estimatedCost",
              status, remarks, created_at as "createdAt"
       FROM bookings ORDER BY id DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching bookings:', err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Create booking
app.post('/api/bookings', async (req, res) => {
  const b = req.body;
  const id = b.id || Date.now();

  try {
    const text = `
      INSERT INTO bookings (
        id, farmer_name, farmer_mobile, farmer_village, tractor_id, tractor_model,
        tractor_owner, work_type, land_area, booking_date, booking_time, duration_hours,
        estimated_cost, status, remarks
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *;
    `;
    const values = [
      id,
      b.farmerName || 'Farmer',
      String(b.farmerMobile || '').replace(/\D/g, ''),
      b.farmerVillage || 'Hasanparthy',
      b.tractorId || null,
      b.tractorModel || 'Standard Tractor',
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
    console.error('Error saving booking:', err);
    res.status(500).json({ error: 'Failed to save booking' });
  }
});

// Update booking status
app.put('/api/bookings/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const result = await query(
      'UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating booking status:', err);
    res.status(500).json({ error: 'Failed to update booking status' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`\n🚀 AgriRent Backend API Server running on http://localhost:${PORT}`);
  console.log(`📡 PostgreSQL Database Target: ${process.env.DB_NAME || 'tractor_rental_db'} on ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}\n`);
});

