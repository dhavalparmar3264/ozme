import User from '../models/User.js';
import OTP from '../models/OTP.js';
import { generateOTP, sendOTP, maskPhone } from '../utils/sms.js';

/**
 * Send OTP to phone number for verification
 * @route POST /api/phone/send-otp
 * @access Private (logged in users only)
 */
export const sendPhoneOTP = async (req, res) => {
  try {
    const { phone } = req.body;
    const userId = req.user.id;

    // Validate phone format (10-digit Indian mobile)
    const cleanPhone = phone?.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 10-digit Indian mobile number',
      });
    }

    // Check if user already has a verified phone
    const currentUser = await User.findById(userId);
    if (currentUser.phoneVerified && currentUser.phone) {
      return res.status(400).json({
        success: false,
        message: 'Your phone number is already verified and cannot be changed',
      });
    }

    // Check if this phone is already used by another user
    const existingUser = await User.findOne({ 
      phone: cleanPhone, 
      _id: { $ne: userId } 
    });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'This phone number is already registered with another account',
      });
    }

    // Rate limiting: Max 3 OTPs per phone per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentOTPs = await OTP.countDocuments({
      phone: cleanPhone,
      createdAt: { $gte: oneHourAgo },
    });

    if (recentOTPs >= 3) {
      return res.status(429).json({
        success: false,
        message: 'Too many OTP requests. Please try again after 1 hour.',
      });
    }

    // Generate 6-digit OTP
    const otp = generateOTP();

    // Delete any existing OTP for this phone
    await OTP.deleteMany({ phone: cleanPhone });

    // Save new OTP (expires in 5 minutes)
    await OTP.create({
      phone: cleanPhone,
      otp,
      purpose: 'VERIFY',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    });

    // Send OTP via SMS
    const smsResult = await sendOTP(cleanPhone, otp);

    if (!smsResult.success) {
      // Delete OTP if SMS failed
      await OTP.deleteMany({ phone: cleanPhone });
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again.',
      });
    }

    res.json({
      success: true,
      message: 'OTP sent successfully',
      data: {
        phone: maskPhone(cleanPhone),
        expiresIn: 300, // 5 minutes in seconds
      },
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

    // Validate inputs
    const cleanPhone = phone?.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and OTP are required',
      });
    }

    // Check if user already has a verified phone
    const currentUser = await User.findById(userId);
    if (currentUser.phoneVerified && currentUser.phone) {
      return res.status(400).json({
        success: false,
        message: 'Your phone number is already verified',
      });
    }

    // Find OTP record
    const otpRecord = await OTP.findOne({ phone: cleanPhone, purpose: 'VERIFY' });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired or not found. Please request a new OTP.',
      });
    }

    // Check attempts
    if (otpRecord.attempts >= 5) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({
        success: false,
        message: 'Too many wrong attempts. Please request a new OTP.',
      });
    }

    // Check OTP expiry
    if (otpRecord.expiresAt < new Date()) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new OTP.',
      });
    }

    // Verify OTP
    if (otpRecord.otp !== otp.toString()) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP',
        attemptsLeft: 5 - otpRecord.attempts,
      });
    }

    // OTP Valid - Delete it
    await OTP.deleteOne({ _id: otpRecord._id });

    // Check again if phone is already used (race condition prevention)
    const phoneInUse = await User.findOne({
      phone: cleanPhone,
      _id: { $ne: userId },
    });
    if (phoneInUse) {
      return res.status(400).json({
        success: false,
        message: 'This phone number is already registered with another account',
      });
    }

    // Update user with verified phone (LOCKED)
    currentUser.phone = cleanPhone;
    currentUser.phoneVerified = true;
    currentUser.phoneVerifiedAt = new Date();
    await currentUser.save();

    res.json({
      success: true,
      message: 'Phone number verified successfully!',
      data: {
        phone: cleanPhone,
        phoneVerified: true,
        phoneVerifiedAt: currentUser.phoneVerifiedAt,
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

    const cleanPhone = phone?.replace(/\D/g, '').slice(-10);
    if (!cleanPhone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required',
      });
    }

    // Check if last OTP was sent less than 30 seconds ago
    const lastOTP = await OTP.findOne({ phone: cleanPhone }).sort({ createdAt: -1 });
    if (lastOTP) {
      const timeSinceLastOTP = Date.now() - lastOTP.createdAt.getTime();
      if (timeSinceLastOTP < 30000) { // 30 seconds
        const waitTime = Math.ceil((30000 - timeSinceLastOTP) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait ${waitTime} seconds before requesting a new OTP`,
          waitTime,
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
        phoneVerified: user.phoneVerified || false,
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

