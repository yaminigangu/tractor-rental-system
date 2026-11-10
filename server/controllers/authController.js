import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import { generateToken, normalizeRole } from '../middleware/auth.js';

/**
 * POST /api/auth/register
 * New User Registration with validation, bcrypt password hashing, and auto-login
 */
export async function register(req, res, next) {
  try {
    const { name, mobile, email, password, role = 'FARMER', village, district, landArea, crops } = req.body;

    const requestedRole = normalizeRole(role);
    if (requestedRole === 'ADMIN') {
      return res.status(400).json({
        success: false,
        error: 'Registration as Administrator is not permitted. Admin accounts are managed by system administrators.'
      });
    }

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

    // Check if mobile or email already exists in either table
    const farmerCheck = await query(
      'SELECT id, mobile, email FROM farmers WHERE mobile = $1 OR mobile LIKE $2 OR LOWER(email) = $3 LIMIT 1',
      [cleanMobile, `%${cleanMobile.slice(-10)}`, normalizedEmail]
    );

    const ownerCheck = await query(
      'SELECT id, mobile, email FROM vehicle_owners WHERE mobile = $1 OR mobile LIKE $2 OR LOWER(email) = $3 LIMIT 1',
      [cleanMobile, `%${cleanMobile.slice(-10)}`, normalizedEmail]
    );

    if (farmerCheck.rows.length > 0 || ownerCheck.rows.length > 0) {
      const match = farmerCheck.rows[0] || ownerCheck.rows[0];
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
    const assignedRole = requestedRole === 'VEHICLE_OWNER' ? 'VEHICLE_OWNER' : 'FARMER';

    if (assignedRole === 'VEHICLE_OWNER') {
      const insertRes = await query(
        `INSERT INTO vehicle_owners (full_name, mobile, email, password_hash, village, district, is_verified, role, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, TRUE, 'VEHICLE_OWNER', TRUE)
         RETURNING id, full_name as name, mobile, email, village, district, role, is_active`,
        [name.trim(), cleanMobile, normalizedEmail, passwordHash, village || 'Hasanparthy', district || 'Hanamkonda']
      );
      newUser = insertRes.rows[0];
    } else {
      const cropsArray = Array.isArray(crops) ? crops : ['Paddy', 'Cotton'];
      const insertRes = await query(
        `INSERT INTO farmers (name, mobile, email, password_hash, village, district, land_area, crops, is_verified, role, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE, 'FARMER', TRUE)
         RETURNING id, name, mobile, email, village, district, land_area as "landArea", role, is_active`,
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
      role: assignedRole
    }, 30 * 24 * 60 * 60 * 1000); // 30 days initial token

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to AgriRent.',
      token,
      role: assignedRole,
      user: {
        id: newUser.id,
        name: newUser.name,
        mobile: newUser.mobile,
        email: newUser.email,
        village: newUser.village,
        district: newUser.district,
        landArea: newUser.landArea,
        role: assignedRole
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
    const { identifier, password, role = 'FARMER', rememberMe = true } = req.body;

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
    let userRole = normalizeRole(role);

    if (userRole === 'VEHICLE_OWNER') {
      const dbRes = await query(
        `SELECT id, full_name as name, mobile, email, password_hash, village, district, COALESCE(role, 'VEHICLE_OWNER') as role, COALESCE(is_active, TRUE) as is_active
         FROM vehicle_owners
         WHERE ${isEmail ? 'LOWER(email) = LOWER($1)' : '(mobile = $1 OR mobile LIKE $2)'}
         LIMIT 1`,
        isEmail ? [trimmedIdentifier] : [cleanMobile, `%${cleanMobile.slice(-10)}`]
      );
      if (dbRes.rows.length > 0) {
        userRecord = dbRes.rows[0];
        userRole = 'VEHICLE_OWNER';
      }
    } else {
      // First search farmers table
      const dbRes = await query(
        `SELECT id, name, mobile, email, password_hash, village, district, land_area as "landArea", COALESCE(role, 'FARMER') as role, COALESCE(is_active, TRUE) as is_active
         FROM farmers
         WHERE ${isEmail ? 'LOWER(email) = LOWER($1)' : '(mobile = $1 OR mobile LIKE $2)'}
         LIMIT 1`,
        isEmail ? [trimmedIdentifier] : [cleanMobile, `%${cleanMobile.slice(-10)}`]
      );
      if (dbRes.rows.length > 0) {
        userRecord = dbRes.rows[0];
        userRole = 'FARMER';
      } else {
        // Fallback: check vehicle owners if user typed an owner identifier in generic login
        const ownerRes = await query(
          `SELECT id, full_name as name, mobile, email, password_hash, village, district, COALESCE(role, 'VEHICLE_OWNER') as role, COALESCE(is_active, TRUE) as is_active
           FROM vehicle_owners
           WHERE ${isEmail ? 'LOWER(email) = LOWER($1)' : '(mobile = $1 OR mobile LIKE $2)'}
           LIMIT 1`,
          isEmail ? [trimmedIdentifier] : [cleanMobile, `%${cleanMobile.slice(-10)}`]
        );
        if (ownerRes.rows.length > 0) {
          userRecord = ownerRes.rows[0];
          userRole = 'VEHICLE_OWNER';
        }
      }
    }

    if (!userRecord) {
      return res.status(401).json({
        success: false,
        error: 'No account found matching this mobile number or email. Please register first.'
      });
    }

    if (userRecord.is_active === false) {
      return res.status(403).json({
        success: false,
        error: 'Your account has been deactivated by the administrator. Please contact AgriRent support for assistance.'
      });
    }

    // Verify Password
    if (!userRecord.password_hash) {
      const saltRounds = 10;
      const newHash = await bcrypt.hash(password, saltRounds);
      if (userRole === 'VEHICLE_OWNER') {
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

    // Canonical uppercase role
    const canonicalRole = normalizeRole(userRecord.role || userRole);

    // Configurable token validity: 30 days for Remember Me, 24 hours otherwise
    const expiresInMs = rememberMe
      ? 30 * 24 * 60 * 60 * 1000
      : 24 * 60 * 60 * 1000;

    const payload = {
      id: userRecord.id,
      name: userRecord.name,
      mobile: userRecord.mobile,
      email: userRecord.email,
      role: canonicalRole
    };

    const token = generateToken(payload, expiresInMs);

    res.json({
      success: true,
      message: 'Login successful! Welcome back.',
      token,
      role: canonicalRole,
      rememberMe: Boolean(rememberMe),
      user: {
        id: userRecord.id,
        name: userRecord.name,
        mobile: userRecord.mobile,
        email: userRecord.email,
        village: userRecord.village,
        district: userRecord.district,
        landArea: userRecord.landArea,
        role: canonicalRole
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
    const { mobile, role = 'FARMER', name } = req.body;

    if (!mobile) {
      return res.status(400).json({ error: 'Mobile number is required to issue session token' });
    }

    const cleanMobile = String(mobile).replace(/\D/g, '');
    const canonicalRole = normalizeRole(role) || 'FARMER';

    // Look up user in PostgreSQL
    let userRecord = null;
    if (canonicalRole === 'FARMER') {
      const dbRes = await query(
        'SELECT id, name, mobile, village, district, land_area as "landArea", role, is_active FROM farmers WHERE mobile = $1 OR mobile LIKE $2',
        [cleanMobile, `%${cleanMobile.slice(-10)}`]
      );
      if (dbRes.rows.length > 0) {
        userRecord = dbRes.rows[0];
      }
    } else if (canonicalRole === 'VEHICLE_OWNER') {
      const dbRes = await query(
        'SELECT id, full_name as name, mobile, village, district, role, is_active FROM vehicle_owners WHERE mobile = $1 OR mobile LIKE $2',
        [cleanMobile, `%${cleanMobile.slice(-10)}`]
      );
      if (dbRes.rows.length > 0) {
        userRecord = dbRes.rows[0];
      }
    }

    if (userRecord && userRecord.is_active === false) {
      return res.status(403).json({ error: 'Account has been deactivated.' });
    }

    const payload = {
      id: userRecord ? userRecord.id : null,
      mobile: cleanMobile,
      name: (userRecord && userRecord.name) || name || 'User',
      role: canonicalRole
    };

    const token = generateToken(payload);

    res.json({
      success: true,
      token,
      role: canonicalRole,
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

  const role = normalizeRole(req.user.role);

  res.json({
    authenticated: true,
    user: {
      ...req.user,
      role
    }
  });
}

/**
 * POST /api/auth/admin-login
 * Authenticate administrator with credentials against database 'admins' table and issue verified admin JWT
 */
export async function adminLogin(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Administrator username and password are required'
      });
    }

    const cleanUsername = username.trim().toLowerCase();

    // Query database admins table
    const adminRes = await query(
      'SELECT id, username, email, password_hash, role, is_active FROM admins WHERE LOWER(username) = $1 OR LOWER(email) = $1 LIMIT 1',
      [cleanUsername]
    );

    let admin = adminRes.rows[0];

    // Fallback if table wasn't seeded yet or legacy env match
    const envUser = (process.env.ADMIN_USERNAME || 'admin').toLowerCase();
    const envPass = process.env.ADMIN_PASSWORD || 'admin123';

    if (!admin && cleanUsername === envUser && password === envPass) {
      // Seed on the fly
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(envPass, salt);
      const insert = await query(
        `INSERT INTO admins (username, email, password_hash, role, is_active)
         VALUES ($1, $2, $3, 'ADMIN', TRUE)
         ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash
         RETURNING id, username, email, role, is_active`,
        ['admin', 'admin@agrirent.telangana.gov.in', hash]
      );
      admin = insert.rows[0];
    }

    if (!admin) {
      return res.status(401).json({
        success: false,
        error: 'Invalid administrator credentials'
      });
    }

    if (admin.is_active === false) {
      return res.status(403).json({
        success: false,
        error: 'This administrator account has been deactivated.'
      });
    }

    // Verify bcrypt password
    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch && password !== envPass) {
      return res.status(401).json({
        success: false,
        error: 'Invalid administrator credentials'
      });
    }

    // Update last_login
    await query('UPDATE admins SET last_login = NOW() WHERE id = $1', [admin.id]);

    // Insert activity log
    try {
      await query(
        `INSERT INTO activity_logs (user_id, user_role, action, details)
         VALUES ($1, 'ADMIN', 'ADMIN_LOGIN', 'Administrator signed into Admin Portal')`,
        [admin.id]
      );
    } catch (logErr) {
      console.warn('Could not write admin activity log:', logErr.message);
    }

    const payload = {
      id: admin.id,
      name: admin.username || 'Platform Administrator',
      role: 'ADMIN',
      email: admin.email || 'admin@agrirent.telangana.gov.in',
      mobile: '9999999999'
    };

    const token = generateToken(payload, 24 * 60 * 60 * 1000); // 24h admin session

    return res.json({
      success: true,
      message: 'Admin authentication successful',
      token,
      role: 'ADMIN',
      user: payload
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Helper to resolve user from req.user or request context
 */
async function resolveUserFromReq(req) {
  let role = req.user ? normalizeRole(req.user.role) : null;
  let id = req.user ? req.user.id : null;
  let mobile = req.user ? req.user.mobile : null;
  let email = req.user ? req.user.email : null;

  // Fallback to request query or headers if JWT was not provided
  if (!id && !mobile && !email) {
    role = normalizeRole(req.query.role || req.headers['x-user-role'] || req.body.role) || 'FARMER';
    mobile = req.query.mobile || req.headers['x-user-mobile'] || req.body.mobile || null;
    email = req.query.email || req.headers['x-user-email'] || req.body.email || null;
    id = req.query.id || req.body.id || null;
  }

  const cleanMobile = mobile ? String(mobile).replace(/\D/g, '') : null;

  if (role === 'ADMIN') {
    let dbRes;
    if (id) {
      dbRes = await query('SELECT * FROM admins WHERE id = $1 LIMIT 1', [id]);
    } else if (email) {
      dbRes = await query('SELECT * FROM admins WHERE LOWER(email) = LOWER($1) OR LOWER(username) = LOWER($1) LIMIT 1', [email]);
    } else {
      dbRes = await query('SELECT * FROM admins LIMIT 1');
    }
    return dbRes.rows[0] ? { ...dbRes.rows[0], role: 'ADMIN' } : null;
  }

  if (role === 'VEHICLE_OWNER') {
    let dbRes;
    if (id) {
      dbRes = await query('SELECT * FROM vehicle_owners WHERE id = $1 LIMIT 1', [id]);
    } else if (cleanMobile) {
      dbRes = await query('SELECT * FROM vehicle_owners WHERE mobile = $1 OR mobile LIKE $2 LIMIT 1', [cleanMobile, `%${cleanMobile.slice(-10)}`]);
    } else if (email) {
      dbRes = await query('SELECT * FROM vehicle_owners WHERE LOWER(email) = LOWER($1) LIMIT 1', [email]);
    }
    return dbRes?.rows[0] ? { ...dbRes.rows[0], role: 'VEHICLE_OWNER' } : null;
  }

  // Default: Farmer
  let dbRes;
  if (id) {
    dbRes = await query('SELECT * FROM farmers WHERE id = $1 LIMIT 1', [id]);
  } else if (cleanMobile) {
    dbRes = await query('SELECT * FROM farmers WHERE mobile = $1 OR mobile LIKE $2 LIMIT 1', [cleanMobile, `%${cleanMobile.slice(-10)}`]);
  } else if (email) {
    dbRes = await query('SELECT * FROM farmers WHERE LOWER(email) = LOWER($1) LIMIT 1', [email]);
  }
  return dbRes?.rows[0] ? { ...dbRes.rows[0], role: 'FARMER' } : null;
}

/**
 * GET /api/auth/profile
 * Retrieves genuine user profile details from PostgreSQL database
 */
export async function getUserProfile(req, res, next) {
  try {
    const user = await resolveUserFromReq(req);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User profile not found in database' });
    }

    if (user.role === 'ADMIN') {
      return res.json({
        success: true,
        profile: {
          id: user.id,
          name: user.full_name || user.username || 'System Administrator',
          username: user.username,
          email: user.email || 'admin@agrirent.telangana.gov.in',
          mobile: user.mobile || '9999999999',
          role: 'ADMIN',
          district: user.district || 'Hanumakonda',
          mandal: user.mandal || 'Hasanparthy',
          address: user.district ? `${user.mandal || ''}, ${user.district}` : 'Telangana Secretariat',
          profilePhoto: user.profile_photo || null,
          registrationDate: user.created_at || new Date().toISOString()
        }
      });
    }

    if (user.role === 'VEHICLE_OWNER') {
      return res.json({
        success: true,
        profile: {
          id: user.id,
          name: user.full_name || 'Vehicle Owner',
          email: user.email || '',
          mobile: user.mobile || '',
          role: 'VEHICLE_OWNER',
          district: user.district || 'Hanumakonda',
          mandal: user.mandal || user.village || 'Hasanparthy',
          address: user.village || '',
          rcNumber: user.rc_number || '',
          tractorModel: user.tractor_model || '',
          profilePhoto: user.profile_photo || user.photo || null,
          registrationDate: user.registered_at || user.created_at || new Date().toISOString()
        }
      });
    }

    // Farmer
    return res.json({
      success: true,
      profile: {
        id: user.id,
        name: user.name || 'Farmer',
        email: user.email || '',
        mobile: user.mobile || '',
        role: 'FARMER',
        district: user.district || 'Hanumakonda',
        mandal: user.mandal || user.village || 'Hasanparthy',
        address: user.village || '',
        landArea: user.land_area || '3.0',
        crops: user.crops || ['Paddy'],
        passbookNo: user.passbook_no || '',
        profilePhoto: user.profile_photo || null,
        registrationDate: user.registered_at || user.created_at || new Date().toISOString()
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/auth/profile
 * Updates user profile information and persists directly to PostgreSQL
 */
export async function updateUserProfile(req, res, next) {
  try {
    const user = await resolveUserFromReq(req);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User profile not found in database' });
    }

    const { name, email, mobile, district, mandal, address, village, profilePhoto, landArea, crops } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Name must be at least 2 characters long' });
    }

    const cleanMobile = mobile ? String(mobile).replace(/\D/g, '') : user.mobile;
    if (cleanMobile && cleanMobile.length < 10) {
      return res.status(400).json({ success: false, error: 'Mobile number must be at least 10 digits' });
    }

    const normEmail = email ? email.trim().toLowerCase() : user.email;
    if (normEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normEmail)) {
      return res.status(400).json({ success: false, error: 'Invalid email address format' });
    }

    const targetVillage = address || village || user.village || 'Hasanparthy';
    const targetDistrict = district || user.district || 'Hanumakonda';
    const targetMandal = mandal || user.mandal || targetVillage;

    let updatedUser = null;

    if (user.role === 'ADMIN') {
      const result = await query(
        `UPDATE admins 
         SET full_name = $1, email = $2, mobile = $3, district = $4, mandal = $5, profile_photo = COALESCE($6, profile_photo)
         WHERE id = $7
         RETURNING id, username, full_name, email, mobile, district, mandal, profile_photo, role`,
        [name.trim(), normEmail, cleanMobile, targetDistrict, targetMandal, profilePhoto || null, user.id]
      );
      updatedUser = result.rows[0];
    } else if (user.role === 'VEHICLE_OWNER') {
      const result = await query(
        `UPDATE vehicle_owners
         SET full_name = $1, email = $2, mobile = $3, village = $4, district = $5, mandal = $6, profile_photo = COALESCE($7, profile_photo)
         WHERE id = $8
         RETURNING id, full_name as name, email, mobile, village, district, mandal, profile_photo, role`,
        [name.trim(), normEmail, cleanMobile, targetVillage, targetDistrict, targetMandal, profilePhoto || null, user.id]
      );
      updatedUser = result.rows[0];
    } else {
      // Farmer
      const cropsArray = Array.isArray(crops) ? crops : user.crops || ['Paddy'];
      const result = await query(
        `UPDATE farmers
         SET name = $1, email = $2, mobile = $3, village = $4, district = $5, mandal = $6, land_area = COALESCE($7, land_area), crops = $8, profile_photo = COALESCE($9, profile_photo)
         WHERE id = $10
         RETURNING id, name, email, mobile, village, district, mandal, land_area as "landArea", crops, profile_photo, role`,
        [name.trim(), normEmail, cleanMobile, targetVillage, targetDistrict, targetMandal, parseFloat(landArea) || null, cropsArray, profilePhoto || null, user.id]
      );
      updatedUser = result.rows[0];
    }

    res.json({
      success: true,
      message: 'Profile updated successfully!',
      user: {
        ...updatedUser,
        role: user.role
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/change-password
 * Changes the user's password with current password verification and bcrypt hashing
 */
export async function changePassword(req, res, next) {
  try {
    const user = await resolveUserFromReq(req);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User account not found' });
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword) {
      return res.status(400).json({ success: false, error: 'Current password is required' });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'New password must be at least 6 characters long' });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, error: 'New password and confirmation do not match' });
    }

    // Verify current password
    if (user.password_hash) {
      const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isMatch) {
        return res.status(400).json({ success: false, error: 'Current password is incorrect' });
      }
    }

    // Hash new password
    const saltRounds = 10;
    const newHash = await bcrypt.hash(newPassword, saltRounds);

    if (user.role === 'ADMIN') {
      await query('UPDATE admins SET password_hash = $1 WHERE id = $2', [newHash, user.id]);
    } else if (user.role === 'VEHICLE_OWNER') {
      await query('UPDATE vehicle_owners SET password_hash = $1 WHERE id = $2', [newHash, user.id]);
    } else {
      await query('UPDATE farmers SET password_hash = $1 WHERE id = $2', [newHash, user.id]);
    }

    res.json({
      success: true,
      message: 'Password changed successfully! Please use your new password next time you log in.'
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/auth/delete-account
 * Permanently deletes or deactivates the user account
 */
export async function deleteAccount(req, res, next) {
  try {
    const user = await resolveUserFromReq(req);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User account not found' });
    }

    if (user.role === 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Primary administrator accounts cannot be deleted directly' });
    }

    if (user.role === 'VEHICLE_OWNER') {
      // Unlist tractors belonging to this owner
      await query('DELETE FROM tractors WHERE owner_mobile = $1 OR mobile = $1', [user.mobile]);
      await query('DELETE FROM vehicle_owners WHERE id = $1', [user.id]);
    } else {
      await query('DELETE FROM farmers WHERE id = $1', [user.id]);
    }

    res.json({
      success: true,
      message: 'Your account and personal data have been permanently deleted.'
    });
  } catch (err) {
    next(err);
  }
}



