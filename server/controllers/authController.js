import { query } from '../db.js';
import { generateToken } from '../middleware/auth.js';

/**
 * POST /api/auth/token
 * Issue a signed JWT token for an authenticated user session
 * Body: { mobile, role, name }
 */
export async function issueSessionToken(req, res, next) {
  try {
    const { mobile, role = 'farmer', name } = req.body;

    if (!mobile) {
      return res.status(400).json({ error: 'Mobile number is required to issue session token' });
    }

    const cleanMobile = String(mobile).replace(/\D/g, '');

    // Look up user in PostgreSQL
    let userRecord = null;
    if (role === 'farmer') {
      const dbRes = await query(
        'SELECT id, name, mobile, village, district, land_area as "landArea" FROM farmers WHERE mobile = $1 OR mobile LIKE $2',
        [cleanMobile, `%${cleanMobile.slice(-10)}`]
      );
      if (dbRes.rows.length > 0) {
        userRecord = dbRes.rows[0];
      }
    } else if (role === 'owner') {
      const dbRes = await query(
        'SELECT id, full_name as name, mobile, village, district FROM vehicle_owners WHERE mobile = $1 OR mobile LIKE $2',
        [cleanMobile, `%${cleanMobile.slice(-10)}`]
      );
      if (dbRes.rows.length > 0) {
        userRecord = dbRes.rows[0];
      }
    }

    const payload = {
      id: userRecord ? userRecord.id : null,
      mobile: cleanMobile,
      name: (userRecord && userRecord.name) || name || 'User',
      role: role || 'farmer'
    };

    const token = generateToken(payload);

    res.json({
      success: true,
      token,
      user: {
        ...payload,
        village: userRecord ? userRecord.village : 'Hasanparthy',
        district: userRecord ? userRecord.district : 'Hanumakonda',
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me
 * Returns current authenticated user from JWT token
 */
export async function getCurrentUser(req, res) {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  res.json({
    authenticated: true,
    user: req.user
  });
}

/**
 * POST /api/auth/admin-login
 * Authenticate administrator with credentials and issue a verified admin JWT token
 */
export async function adminLogin(req, res, next) {
  try {
    const { username, password } = req.body;
    const adminUser = process.env.ADMIN_USERNAME || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD || 'admin123';

    if (username && username.trim().toLowerCase() === adminUser.toLowerCase() && password === adminPass) {
      const payload = {
        id: 0,
        name: 'Platform Administrator',
        role: 'admin',
        mobile: '9999999999'
      };

      const token = generateToken(payload);

      return res.json({
        success: true,
        token,
        user: payload
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Invalid administrator credentials'
    });
  } catch (err) {
    next(err);
  }
}

