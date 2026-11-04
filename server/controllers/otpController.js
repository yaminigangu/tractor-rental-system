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
 * Body: { verificationId, code, countryCode }
 */
export async function verifyOtpHandler(req, res, next) {
  try {
    const { verificationId, code, countryCode, mobileNumber } = req.body;
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
      if (mobileNumber) {
        const cleanMobile = String(mobileNumber).replace(/\D/g, '');
        const dbRes = await query(
          'SELECT id, name, mobile, village, district, land_area as "landArea" FROM farmers WHERE mobile = $1 OR mobile LIKE $2',
          [cleanMobile, `%${cleanMobile.slice(-10)}`]
        );
        if (dbRes.rows.length > 0) {
          farmer = dbRes.rows[0];
        }
        token = generateToken({
          id: farmer ? farmer.id : null,
          mobile: cleanMobile,
          name: farmer ? farmer.name : 'Farmer',
          role: 'farmer'
        });
      }

      return res.status(200).json({
        ...result,
        token,
        farmer
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
    countryCode: process.env.MESSAGE_CENTRAL_COUNTRY_CODE || '91'
  });
}

