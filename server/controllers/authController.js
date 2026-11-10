import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import { generateToken } from '../middleware/auth.js';

/**
 * POST /api/auth/register
 * New User Registration with validation, bcrypt password hashing, and auto-login
 */
export async function register(req, res, next) {
  try {
    const { name, mobile, email, password, role = 'farmer', village, district, landArea, crops } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Full name is required (minimum 2 characters)' });
    }

    const cleanMobile = String(mobile || '').replace(/\D/g, '');
    if (cleanMobile.length < 10) {
      return res.status(400).json({ success: false, error: 'Valid 10-digit mobile number is required' });
    }

    const normalizedEmail = (email || '').trim().toLowerCase();
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ success: false, error: 'Valid email address is required (e.g. farmer@example.com)' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long' });
    }

    // Check if mobile or email already exists in farmers
    const existingCheck = await query(
      'SELECT id, mobile, email FROM farmers WHERE mobile = $1 OR mobile LIKE $2 OR LOWER(email) = $3 LIMIT 1',
      [cleanMobile, `%${cleanMobile.slice(-10)}`, normalizedEmail]
    );

    if (existingCheck.rows.length > 0) {
      const match = existingCheck.rows[0];
      const conflictField = match.email && match.email.toLowerCase() === normalizedEmail ? 'email address' : 'mobile number';
      return res.status(409).json({
        success: false,
        error: `An account with this ${conflictField} already exists. Please log in instead.`
      });
    }

    // Hash password with bcryptjs
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    let newUser = null;

    if (role === 'owner') {
      const insertRes = await query(
        `INSERT INTO vehicle_owners (full_name, mobile, email, password_hash, village, district, is_verified)
         VALUES ($1, $2, $3, $4, $5, $6, TRUE)
         RETURNING id, full_name as name, mobile, email, village, district`,
        [name.trim(), cleanMobile, normalizedEmail, passwordHash, village || 'Hasanparthy', district || 'Hanamkonda']
      );
      newUser = insertRes.rows[0];
    } else {
      const cropsArray = Array.isArray(crops) ? crops : ['Paddy', 'Cotton'];
      const insertRes = await query(
        `INSERT INTO farmers (name, mobile, email, password_hash, village, district, land_area, crops, is_verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
         RETURNING id, name, mobile, email, village, district, land_area as "landArea"`,
        [name.trim(), cleanMobile, normalizedEmail, passwordHash, village || 'Hasanparthy', district || 'Hanamkonda', parseFloat(landArea) || 3.0, cropsArray]
      );
      newUser = insertRes.rows[0];
    }

    // Auto-generate JWT session token for instant seamless login
    const token = generateToken({
      id: newUser.id,
      name: newUser.name,
      mobile: newUser.mobile,
      email: newUser.email,
      role: role || 'farmer'
    }, 30 * 24 * 60 * 60 * 1000); // 30 days initial token

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to AgriRent.',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        mobile: newUser.mobile,
        email: newUser.email,
        village: newUser.village,
        district: newUser.district,
        landArea: newUser.landArea,
        role: role || 'farmer'
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 * Existing User Login using Mobile/Email + Password + Persistent "Remember Me"
 */
export async function login(req, res, next) {
  try {
    const { identifier, password, role = 'farmer', rememberMe = true } = req.body;

    if (!identifier || !identifier.trim()) {
      return res.status(400).json({ success: false, error: 'Mobile number or email is required' });
    }

    if (!password) {
      return res.status(400).json({ success: false, error: 'Password is required' });
    }

    const trimmedIdentifier = identifier.trim();
    const cleanMobile = trimmedIdentifier.replace(/\D/g, '');
    const isEmail = trimmedIdentifier.includes('@');

    let userRecord = null;
    let userRole = role;

    if (userRole === 'owner') {
      const dbRes = await query(
        `SELECT id, full_name as name, mobile, email, password_hash, village, district
         FROM vehicle_owners
         WHERE ${isEmail ? 'LOWER(email) = LOWER($1)' : '(mobile = $1 OR mobile LIKE $2)'}
         LIMIT 1`,
        isEmail ? [trimmedIdentifier] : [cleanMobile, `%${cleanMobile.slice(-10)}`]
      );
      if (dbRes.rows.length > 0) userRecord = dbRes.rows[0];
    } else {
      // First search farmers table
      const dbRes = await query(
        `SELECT id, name, mobile, email, password_hash, village, district, land_area as "landArea"
         FROM farmers
         WHERE ${isEmail ? 'LOWER(email) = LOWER($1)' : '(mobile = $1 OR mobile LIKE $2)'}
         LIMIT 1`,
        isEmail ? [trimmedIdentifier] : [cleanMobile, `%${cleanMobile.slice(-10)}`]
      );
      if (dbRes.rows.length > 0) {
        userRecord = dbRes.rows[0];
        userRole = 'farmer';
      } else {
        // Fallback: check vehicle owners if user typed an owner identifier
        const ownerRes = await query(
          `SELECT id, full_name as name, mobile, email, password_hash, village, district
           FROM vehicle_owners
           WHERE ${isEmail ? 'LOWER(email) = LOWER($1)' : '(mobile = $1 OR mobile LIKE $2)'}
           LIMIT 1`,
          isEmail ? [trimmedIdentifier] : [cleanMobile, `%${cleanMobile.slice(-10)}`]
        );
        if (ownerRes.rows.length > 0) {
          userRecord = ownerRes.rows[0];
          userRole = 'owner';
        }
      }
    }

    if (!userRecord) {
      return res.status(401).json({
        success: false,
        error: 'No account found matching this mobile number or email. Please register first.'
      });
    }

    // Verify Password
    if (!userRecord.password_hash) {
      // If legacy OTP account without password yet, allow setting password or inform user
      // For developer ease & testing, accept password and upgrade account
      const saltRounds = 10;
      const newHash = await bcrypt.hash(password, saltRounds);
      if (userRole === 'owner') {
        await query('UPDATE vehicle_owners SET password_hash = $1 WHERE id = $2', [newHash, userRecord.id]);
      } else {
        await query('UPDATE farmers SET password_hash = $1 WHERE id = $2', [newHash, userRecord.id]);
      }
    } else {
      const isMatch = await bcrypt.compare(password, userRecord.password_hash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: 'Incorrect password. Please verify your credentials and try again.'
        });
      }
    }

    // Configurable token validity: 30 days for Remember Me, 24 hours otherwise
    const expiresInMs = rememberMe
      ? 30 * 24 * 60 * 60 * 1000
      : 24 * 60 * 60 * 1000;

    const payload = {
      id: userRecord.id,
      name: userRecord.name,
      mobile: userRecord.mobile,
      email: userRecord.email,
      role: userRole
    };

    const token = generateToken(payload, expiresInMs);

    res.json({
      success: true,
      message: 'Login successful! Welcome back.',
      token,
      role: userRole,
      rememberMe: Boolean(rememberMe),
      user: {
        id: userRecord.id,
        name: userRecord.name,
        mobile: userRecord.mobile,
        email: userRecord.email,
        village: userRecord.village,
        district: userRecord.district,
        landArea: userRecord.landArea,
        role: userRole
      }
    });
  } catch (err) {
    next(err);
  }
}

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

