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
    const { verificationId, code, countryCode, mobileNumber, role = 'farmer' } = req.body;
    if (!verificationId) {
      return res.status(400).json({ error: 'verificationId is required' });
    }
    if (!code) {
      return res.status(400).json({ error: 'OTP code is required' });
    }

    const result = await validateOtp({
      verificationId,
      code,
      countryCode
    });

    if (result.success && result.verified) {
      let token = null;
      let farmer = null;
      let owner = null;

      if (mobileNumber) {
        const cleanMobile = String(mobileNumber).replace(/\D/g, '');

        if (role === 'owner') {
          // Look up vehicle owner in PostgreSQL
          try {
            const ownerRes = await query(
              'SELECT id, full_name as "fullName", mobile, village, district, rc_number as "rcNumber", vehicle_number as "vehicleNumber", tractor_model as "tractorModel" FROM vehicle_owners WHERE mobile = $1 OR mobile LIKE $2',
              [cleanMobile, `%${cleanMobile.slice(-10)}`]
            );
            if (ownerRes.rows.length > 0) {
              owner = ownerRes.rows[0];
            }
          } catch (dbErr) {
            console.warn('Vehicle owner DB query error:', dbErr.message);
          }

          token = generateToken({
            id: owner ? owner.id : null,
            mobile: cleanMobile,
            name: owner ? owner.fullName : 'Vehicle Owner',
            role: 'owner'
          });
        } else {
          // Look up farmer in PostgreSQL
          try {
            const dbRes = await query(
              'SELECT id, name, mobile, village, district, land_area as "landArea" FROM farmers WHERE mobile = $1 OR mobile LIKE $2',
              [cleanMobile, `%${cleanMobile.slice(-10)}`]
            );
            if (dbRes.rows.length > 0) {
              farmer = dbRes.rows[0];
            } else {
              // Ensure farmer has a persistent database ID for booking associations
              try {
                const insRes = await query(
                  'INSERT INTO farmers (name, mobile, village, district, land_area, is_verified) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, mobile, village, district, land_area as "landArea"',
                  ['Farmer', cleanMobile, 'Hasanparthy', 'Hanumakonda', 3.0, true]
                );
                if (insRes.rows.length > 0) {
                  farmer = insRes.rows[0];
                }
              } catch (insErr) {
                console.warn('Auto-provision farmer record notice:', insErr.message);
              }
            }
          } catch (dbErr) {
            console.warn('Farmer DB query error:', dbErr.message);
          }

          token = generateToken({
            id: farmer ? farmer.id : null,
            mobile: cleanMobile,
            name: farmer ? farmer.name : 'Farmer',
            role: 'farmer'
          });
        }
      }

      return res.status(200).json({
        ...result,
        token,
        farmer,
        owner
      });
    }

    return res.status(400).json(result);
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

