import User from '../models/User.js';
import OTP from '../models/OTP.js';
import { generateOTP, sendOTP, maskPhone } from '../utils/sms.js';
import { getOTPConfig } from '../config/otp.js';
import { normalizePhone, isValidIndianPhone } from '../utils/phoneNormalize.js';

/**
 * Send OTP to phone number for verification
 * @route POST /api/phone/send-otp
 * @access Private (logged in users only)
 */
export const sendPhoneOTP = async (req, res) => {
  try {
    const { phone } = req.body;
    const userId = req.user.id;

    // Get OTP configuration for expiry and limits
    const otpConfig = getOTPConfig();

    // CRITICAL: Normalize phone to consistent format for uniqueness enforcement
    // This ensures +91XXXXXXXXXX, 91XXXXXXXXXX, and 10-digit all become the same format
    const cleanPhone = normalizePhone(phone);
    
    if (!cleanPhone || !isValidIndianPhone(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number. Please enter a valid 10-digit Indian mobile number.',
        errorCode: 'INVALID_PHONE',
      });
    }
    
    // Log normalized phone for debugging (masked)
    console.log(`[sendPhoneOTP] Normalized phone: ${maskPhone(cleanPhone)}`);

    // Get current user
    const currentUser = await User.findById(userId);
    
    // Allow changing phone number if user wants to verify a new number
    // (Remove the restriction that prevents changing verified phone)

    // Check if this phone is already used by another user (enforce global uniqueness)
    // CRITICAL: Use normalized phone for comparison to prevent format-based bypass
    const existingUser = await User.findOne({ 
      phone: cleanPhone, // DB stores normalized format, so this works
      _id: { $ne: userId } 
    });
    if (existingUser) {
      // If phone is verified on another account, return 409 Conflict (permanent block)
      if (existingUser.phoneVerified) {
        console.log(`[sendPhoneOTP] Phone ${maskPhone(cleanPhone)} already verified on account ${existingUser._id}`);
        return res.status(409).json({
          success: false,
          message: 'This phone number is already linked to another account',
          errorCode: 'PHONE_ALREADY_LINKED',
        });
      }
      // If phone exists but NOT verified, allow reuse (unverified numbers can be reused)
      // This prevents permanent blocking from abandoned/unverified registrations
      console.log(`[sendPhoneOTP] Phone ${maskPhone(cleanPhone)} exists but not verified, allowing reuse`);
      // Continue with OTP send (will update the existing user's phone if needed)
    }

    // Rate limiting is handled by middleware, but we keep this as backup
    // Per-phone rate limiting: max 3 requests per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentOTPs = await OTP.countDocuments({
      phone: cleanPhone,
      createdAt: { $gte: oneHourAgo },
    });

    if (recentOTPs >= 3) {
      return res.status(429).json({
        success: false,
        message: 'Too many OTP requests. Please try again after 1 hour.',
        retryAfter: 3600,
      });
    }

    // Generate 6-digit OTP
    const otp = generateOTP();

    // Delete any existing OTP for this phone
    await OTP.deleteMany({ phone: cleanPhone });

    // Save new OTP with configurable expiry
    const expiresAt = new Date(Date.now() + otpConfig.expiryMinutes * 60 * 1000);
    await OTP.create({
      phone: cleanPhone,
      otp,
      purpose: 'VERIFY',
      expiresAt,
    });

    // Send OTP via SMS
    const smsResult = await sendOTP(cleanPhone, otp);

    if (!smsResult.success) {
      // Delete OTP if SMS failed
      await OTP.deleteMany({ phone: cleanPhone });
      
      // Return appropriate status code based on error
      const statusCode = smsResult.errorCode === 'OTP_CONFIG_ERROR' || 
                        smsResult.errorCode === 'OTP_PROVIDER_URL_ERROR' ? 500 : 500;
      
      return res.status(statusCode).json({
        success: false,
        message: smsResult.message || 'Failed to send OTP. Please try again.',
        errorCode: smsResult.errorCode || 'OTP_SEND_ERROR',
      });
    }

    // Prepare response data
    const responseData = {
      phone: maskPhone(cleanPhone),
      expiresIn: otpConfig.expiryMinutes * 60, // in seconds
      expiresAt: expiresAt.toISOString(),
    };

    // In test mode, include OTP in response (for testing only)
    if (otpConfig.testMode && smsResult.data && smsResult.data.otp) {
      responseData.testMode = true;
      responseData.otp = smsResult.data.otp; // Include OTP for testing
      responseData.message = 'TEST MODE: OTP returned in response. No SMS sent.';
    }

    res.json({
      success: true,
      message: smsResult.message || 'OTP sent successfully',
      data: responseData,
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send OTP',
    });
  }
};

/**
 * Verify OTP and lock phone number to account
 * @route POST /api/phone/verify-otp
 * @access Private (logged in users only)
 */
export const verifyPhoneOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    const userId = req.user.id;

    // Get OTP configuration for max attempts
    const otpConfig = getOTPConfig();

    // CRITICAL: Normalize phone to consistent format for uniqueness enforcement
    const cleanPhone = normalizePhone(phone);
    if (!cleanPhone || !isValidIndianPhone(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number. Please enter a valid 10-digit Indian mobile number.',
        errorCode: 'INVALID_PHONE',
      });
    }
    
    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'OTP is required',
      });
    }
    
    // Log normalized phone for debugging (masked)
    console.log(`[verifyPhoneOTP] Normalized phone: ${maskPhone(cleanPhone)}`);

    // Get current user
    const currentUser = await User.findById(userId);
    
    // Allow verification even if already verified (for re-verification or number change)

    // Find OTP record
    const otpRecord = await OTP.findOne({ phone: cleanPhone, purpose: 'VERIFY' });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired or not found. Please request a new OTP.',
        code: 'OTP_NOT_FOUND',
      });
    }

    // Check attempts using configurable max attempts
    if (otpRecord.attempts >= otpConfig.maxAttempts) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(423).json({
        success: false,
        message: 'Too many wrong attempts. Please request a new OTP.',
        code: 'OTP_LOCKED',
      });
    }

    // Check OTP expiry
    if (otpRecord.expiresAt < new Date()) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new OTP.',
        code: 'OTP_EXPIRED',
      });
    }

    // Verify OTP
    if (otpRecord.otp !== otp.toString()) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      const attemptsLeft = otpConfig.maxAttempts - otpRecord.attempts;
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP',
        attemptsLeft,
        code: 'INVALID_OTP',
      });
    }

    // OTP Valid - Delete it immediately (invalidate after successful verification)
    await OTP.deleteOne({ _id: otpRecord._id });

    // Check again if phone is already used by another user (race condition prevention + uniqueness enforcement)
    // CRITICAL: Use normalized phone for comparison
    const phoneInUse = await User.findOne({
      phone: cleanPhone, // DB stores normalized format
      _id: { $ne: userId },
    });
    if (phoneInUse) {
      // If phone is verified on another account, return 409 Conflict (permanent block)
      if (phoneInUse.phoneVerified) {
        console.log(`[verifyPhoneOTP] Phone ${maskPhone(cleanPhone)} already verified on account ${phoneInUse._id}`);
        return res.status(409).json({
          success: false,
          message: 'This phone number is already linked to another account',
          code: 'PHONE_ALREADY_LINKED',
          errorCode: 'PHONE_ALREADY_LINKED',
        });
      }
      // If phone exists but NOT verified, allow verification (unverified numbers can be reused)
      // This prevents permanent blocking from abandoned/unverified registrations
      console.log(`[verifyPhoneOTP] Phone ${maskPhone(cleanPhone)} exists but not verified, allowing verification`);
      // Continue with verification (will update the existing user's phone if needed)
    }

    // Update user with verified phone
    currentUser.phone = cleanPhone;
    currentUser.phoneVerified = true;
    currentUser.phoneVerifiedAt = new Date();
    await currentUser.save();

    // Return updated user object with both fields for compatibility
    res.json({
      success: true,
      message: 'Phone number verified successfully!',
      data: {
        phone: cleanPhone,
        phoneNumber: `91${cleanPhone}`, // Normalized format
        phoneVerified: true,
        isPhoneVerified: true, // Alias for frontend compatibility
        phoneVerifiedAt: currentUser.phoneVerifiedAt,
        user: {
          id: currentUser._id,
          name: currentUser.name,
          email: currentUser.email,
          phone: cleanPhone,
          phoneVerified: true,
          isPhoneVerified: true, // Alias for frontend compatibility
          phoneVerifiedAt: currentUser.phoneVerifiedAt,
        },
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to verify OTP',
    });
  }
};

/**
 * Resend OTP (with rate limiting)
 * @route POST /api/phone/resend-otp
 * @access Private (logged in users only)
 */
export const resendPhoneOTP = async (req, res) => {
  try {
    const { phone } = req.body;
    const userId = req.user.id;

    // Get OTP configuration for resend cooldown
    const otpConfig = getOTPConfig();

    // CRITICAL: Normalize phone to consistent format
    const cleanPhone = normalizePhone(phone);
    if (!cleanPhone || !isValidIndianPhone(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number. Please enter a valid 10-digit Indian mobile number.',
        errorCode: 'INVALID_PHONE',
      });
    }

    // Check resend cooldown using configurable value
    const lastOTP = await OTP.findOne({ phone: cleanPhone }).sort({ createdAt: -1 });
    if (lastOTP) {
      const timeSinceLastOTP = Date.now() - lastOTP.createdAt.getTime();
      const cooldownMs = otpConfig.resendCooldownSeconds * 1000;
      
      if (timeSinceLastOTP < cooldownMs) {
        const waitTime = Math.ceil((cooldownMs - timeSinceLastOTP) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait ${waitTime} seconds before requesting a new OTP`,
          waitTime,
          retryAfter: waitTime,
        });
      }
    }

    // Use sendPhoneOTP logic
    req.body.phone = cleanPhone;
    return sendPhoneOTP(req, res);
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to resend OTP',
    });
  }
};

/**
 * Get phone verification status
 * @route GET /api/phone/status
 * @access Private (logged in users only)
 */
export const getPhoneStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.json({
      success: true,
      data: {
        phone: user.phone || null,
        phoneNumber: user.phone ? `91${user.phone}` : null, // Normalized format
        phoneVerified: user.phoneVerified || false,
        isPhoneVerified: user.phoneVerified || false, // Alias for frontend
        phoneVerifiedAt: user.phoneVerifiedAt || null,
        canCheckout: user.phoneVerified === true,
      },
    });
  } catch (error) {
    console.error('Get phone status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get phone status',
    });
  }
};

/**
 * Change phone number (unverify and allow new verification)
 * @route POST /api/phone/change
 * @access Private (logged in users only)
 */
export const changePhoneNumber = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentUser = await User.findById(userId);

    if (!currentUser.phoneVerified) {
      return res.status(400).json({
        success: false,
        message: 'No verified phone number to change',
      });
    }

    // Unverify phone (user will need to verify new number)
    currentUser.phoneVerified = false;
    currentUser.phoneVerifiedAt = null;
    // Keep old phone for reference, but mark as unverified
    await currentUser.save();

    res.json({
      success: true,
      message: 'Phone number unverified. Please verify your new phone number.',
      data: {
        phoneVerified: false,
        canVerifyNew: true,
      },
    });
  } catch (error) {
    console.error('Change phone number error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to change phone number',
    });
  }
};
