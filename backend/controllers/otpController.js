import {
  sendOtp,
  validateOtp,
  isMessageCentralConfigured
} from '../services/messageCentralService.js';
import { generateToken } from '../middleware/auth.js';
import { query } from '../db.js';

/**
 * POST /api/otp/send
 * Body: { mobileNumber, flowType, countryCode, otpLength }
 */
export async function sendOtpHandler(req, res, next) {
  try {
    const { mobileNumber, flowType, countryCode, otpLength } = req.body;
    if (!mobileNumber) {
      return res.status(400).json({ error: 'mobileNumber is required' });
    }

    const result = await sendOtp({
      mobileNumber,
      flowType,
      countryCode,
      otpLength
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/otp/verify
 * Body: { verificationId, code, countryCode, mobileNumber, role }
 */

export async function verifyOtpHandler(req, res, next) {
  try {
    const {
      verificationId,
      code,
      countryCode,
      mobileNumber,
      role = 'farmer',
      flowType = 'registration'
    } = req.body;

    // 1. Validate required fields
    if (!verificationId || !code || !mobileNumber) {
      return res.status(400).json({
        success: false,
        error: 'verificationId, code and mobileNumber are required'
      });
    }

    // 2. Normalize and validate mobile number
    const cleanMobile = String(mobileNumber)
      .replace(/\D/g, '')
      .slice(-10);

    if (cleanMobile.length !== 10) {
      return res.status(400).json({
        success: false,
        error: 'Valid 10-digit mobile number is required'
      });
    }

    // 3. Normalize role
    const normalizedRole = String(role).trim().toUpperCase();

    let userRole;

    if (['OWNER', 'VEHICLE_OWNER'].includes(normalizedRole)) {
      userRole = 'VEHICLE_OWNER';
    } else if (normalizedRole === 'FARMER') {
      userRole = 'FARMER';
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid role. Use FARMER or VEHICLE_OWNER.'
      });
    }

    // 4. Verify OTP
    const otpResult = await validateOtp({
      verificationId,
      code,
      mobileNumber,
      countryCode
    });

    if (!otpResult.success || !otpResult.verified) {
      return res.status(400).json({
        success: false,
        error: otpResult.error || otpResult.message || 'Invalid or expired OTP'
      });
    }

    const last10 = cleanMobile.slice(-10);

    let user = null;

    // 5. Check if account already exists in PostgreSQL
    if (userRole === 'VEHICLE_OWNER') {
      const ownerRes = await query(
        `SELECT
           id,
           full_name AS name,
           mobile,
           email,
           village,
           district,
           COALESCE(is_active, TRUE) AS "isActive"
         FROM vehicle_owners
         WHERE mobile = $1 OR mobile LIKE $2
         LIMIT 1`,
        [cleanMobile, `%${last10}`]
      );

      if (ownerRes.rowCount > 0) {
        user = ownerRes.rows[0];
      }

    } else {
      const farmerRes = await query(
        `SELECT
           id,
           name,
           mobile,
           email,
           village,
           district,
           land_area AS "landArea",
           COALESCE(is_active, TRUE) AS "isActive"
         FROM farmers
         WHERE mobile = $1 OR mobile LIKE $2
         LIMIT 1`,
        [cleanMobile, `%${last10}`]
      );

      if (farmerRes.rowCount > 0) {
        user = farmerRes.rows[0];
      }
    }

    const isLogin = String(flowType).trim().toLowerCase() === 'login';

    // If account does NOT exist in database:
    if (!user) {
      // If user is trying to LOG IN, existing account is required
      if (isLogin) {
        return res.status(404).json({
          success: false,
          error: userRole === 'VEHICLE_OWNER'
            ? 'Vehicle owner account not found. Please register first.'
            : 'Farmer account not found. Please register first.'
        });
      }

      // If user is REGISTERING: mobile number is successfully verified!
      return res.status(200).json({
        success: true,
        verified: true,
        isNewUser: true,
        message: 'OTP verified successfully. Please proceed with registration.',
        role: userRole,
        mobile: cleanMobile
      });
    }

    // 6. Reject deactivated accounts
    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        error: 'Your account has been deactivated by the administrator.'
      });
    }

    // 7. Mark the account as verified after successful OTP
    const table =
      userRole === 'VEHICLE_OWNER'
        ? 'vehicle_owners'
        : 'farmers';

    const verifiedRes = await query(
      `UPDATE ${table}
       SET is_verified = TRUE
       WHERE id = $1
       RETURNING id`,
      [user.id]
    );

    if (verifiedRes.rowCount === 0) {
      return res.status(500).json({
        success: false,
        error: 'Could not update account verification status'
      });
    }

    // 8. Generate JWT only for an existing, active account
    const token = generateToken({
      id: user.id,
      name: user.name,
      mobile: user.mobile,
      email: user.email,
      role: userRole
    });

    // 9. Return successful response
    return res.status(200).json({
      success: true,
      verified: true,
      isNewUser: false,
      message: 'OTP verified and login successful',
      token,
      role: userRole,
      user,
      farmer: userRole === 'FARMER' ? user : null,
      owner: userRole === 'VEHICLE_OWNER' ? user : null
    });

  } catch (err) {
    next(err);
  }
}


/**
 * GET /api/otp/status
 * Returns whether Message Central 3rd-party credentials are fully configured
 */
export async function getOtpStatusHandler(req, res) {
  const isLive = isMessageCentralConfigured();
  res.json({
    service: 'Message Central VerifyNow',
    isLive,
    mode: isLive ? 'Production Live SMS' : 'Simulator / Test Mode',
    flowType: process.env.MESSAGE_CENTRAL_FLOW_TYPE || 'SMS',
    countryCode: process.env.MESSAGE_CENTRAL_COUNTRY_CODE || '91',
    testModeAvailable: true,
    testNumbers: [
      '9876543210 (Ramesh Kumar - Owner)',
      '9440156789 (Suresh Patel - Owner)',
      '9876500001 (Suresh Kumar - Farmer)',
      '9999999999 (Universal Test)',
      '9000000000 (Universal Test)'
    ],
    universalTestOtps: ['354498', '123456']
  });
}

