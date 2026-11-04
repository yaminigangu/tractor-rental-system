import {
  sendOtp,
  validateOtp,
  isMessageCentralConfigured
} from '../services/messageCentralService.js';

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
    const { verificationId, code, countryCode } = req.body;
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
      return res.status(200).json(result);
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

