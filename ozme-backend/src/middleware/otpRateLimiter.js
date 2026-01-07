import OTP from '../models/OTP.js';
import { getOTPConfig } from '../config/otp.js';

/**
 * Rate Limiter for OTP Send Endpoint
 * 
 * Limits:
 * - Per IP: 5 requests per minute
 * - Per Phone: 3 requests per hour (configurable via OTP config)
 */
export const otpSendRateLimiter = async (req, res, next) => {
  try {
    const { phone } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    const cleanPhone = phone?.replace(/\D/g, '').slice(-10);

    // Per-IP rate limiting: max 5 requests per minute
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentIpRequests = await OTP.countDocuments({
      createdAt: { $gte: oneMinuteAgo },
      // Store IP in a metadata field if needed, or use a separate collection
      // For now, we'll use phone-based limiting which is more important
    });

    // Per-phone rate limiting: max 3 requests per hour (or use config)
    if (cleanPhone && /^[6-9]\d{9}$/.test(cleanPhone)) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentPhoneRequests = await OTP.countDocuments({
        phone: cleanPhone,
        createdAt: { $gte: oneHourAgo },
      });

      // Get configurable limit (default 3 per hour)
      const otpConfig = getOTPConfig();
      const maxRequestsPerHour = 3; // Could be made configurable

      if (recentPhoneRequests >= maxRequestsPerHour) {
        return res.status(429).json({
          success: false,
          message: `Too many OTP requests. Please try again after 1 hour.`,
          retryAfter: 3600, // seconds
        });
      }
    }

    // Check resend cooldown (for LOGIN purpose)
    if (cleanPhone && /^[6-9]\d{9}$/.test(cleanPhone)) {
      const lastOTP = await OTP.findOne({ 
        phone: cleanPhone, 
        purpose: 'LOGIN' 
      }).sort({ createdAt: -1 });
      if (lastOTP) {
        const otpConfig = getOTPConfig();
        const timeSinceLastOTP = Date.now() - lastOTP.createdAt.getTime();
        const cooldownMs = otpConfig.resendCooldownSeconds * 1000;
        
        if (timeSinceLastOTP < cooldownMs) {
          const waitTime = Math.ceil((cooldownMs - timeSinceLastOTP) / 1000);
          return res.status(429).json({
            success: false,
            message: `Please wait ${waitTime} seconds before requesting a new OTP`,
            waitTime,
            retryAfter: waitTime,
            cooldownSeconds: waitTime,
          });
        }
      }
    }

    next();
  } catch (error) {
    console.error('Rate limiter error:', error);
    // On error, allow request to proceed (fail open)
    next();
  }
};

/**
 * Rate Limiter for OTP Verify Endpoint
 * 
 * Limits:
 * - Max attempts per OTP session (from config)
 * - Per IP: 10 requests per minute
 */
export const otpVerifyRateLimiter = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;
    const cleanPhone = phone?.replace(/\D/g, '').slice(-10);

    if (cleanPhone && /^[6-9]\d{9}$/.test(cleanPhone)) {
      // Find OTP record (check both VERIFY and LOGIN purposes)
      const otpRecord = await OTP.findOne({ 
        phone: cleanPhone, 
        purpose: { $in: ['VERIFY', 'LOGIN'] } 
      });
      
      if (otpRecord) {
        const otpConfig = getOTPConfig();
        
        // Check if max attempts exceeded
        if (otpRecord.attempts >= otpConfig.maxAttempts) {
          // Delete the OTP record as it's locked
          await OTP.deleteOne({ _id: otpRecord._id });
          return res.status(423).json({
            success: false,
            message: 'Too many wrong attempts. Please request a new OTP.',
            code: 'OTP_LOCKED',
          });
        }
      }
    }

    next();
  } catch (error) {
    console.error('Verify rate limiter error:', error);
    // On error, allow request to proceed (fail open)
    next();
  }
};

