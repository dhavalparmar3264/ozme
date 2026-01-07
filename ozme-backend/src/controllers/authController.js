import User from '../models/User.js';
import OTP from '../models/OTP.js';
import { generateToken } from '../utils/generateToken.js';
import { isDBConnected } from '../config/db.js';
import { generateOTP, sendOTP, maskPhone } from '../utils/sms.js';
import { getOTPConfig } from '../config/otp.js';
import { normalizePhone, isValidIndianPhone } from '../utils/phoneNormalize.js';
import { getClientIp, getClientUserAgent, formatPhoneE164 } from '../utils/getClientInfo.js';
import { findUserByEmail, findUserByPhone, linkAuthProvider, checkAndMergeDuplicates, mergeAccounts } from '../utils/accountLinking.js';

/**
 * Register a new user
 * @route POST /api/auth/register
 */
export const register = async (req, res) => {
  try {
    // Check if database is connected
    if (!isDBConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database is not available. Please try again later.',
        errorCode: 'DATABASE_UNAVAILABLE',
      });
    }

    const { name, email, password, phone } = req.body;

    // Validate password requirements
    if (password) {
      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters long.',
          errorCode: 'PASSWORD_TOO_SHORT',
        });
      }
      if (!/[A-Z]/.test(password)) {
        return res.status(400).json({
          success: false,
          message: 'Password must contain at least one uppercase letter.',
          errorCode: 'PASSWORD_NO_UPPERCASE',
        });
      }
      if (!/[0-9]/.test(password)) {
        return res.status(400).json({
          success: false,
          message: 'Password must contain at least one number.',
          errorCode: 'PASSWORD_NO_NUMBER',
        });
      }
    }

    // Check if user exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.',
        errorCode: 'USER_EXISTS',
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone,
    });

    // Generate token
    const token = generateToken(user._id);

    // Set cookie with 30-day expiry
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Changed from 'strict' to 'lax' for better cross-site compatibility
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

/**
 * Login user
 * @route POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    // Check if database is connected
    if (!isDBConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database is not available. Please try again later.',
        errorCode: 'DATABASE_UNAVAILABLE',
      });
    }

    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'No account found with this email.',
        errorCode: 'USER_NOT_FOUND',
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password. Please try again.',
        errorCode: 'WRONG_PASSWORD',
      });
    }

    // Track login audit information
    const clientIp = getClientIp(req);
    const userAgent = getClientUserAgent(req);

    // Link email provider
    await linkAuthProvider(user, 'email');

    user.lastLoginAt = new Date();
    user.lastLoginMethod = 'email';
    user.lastLoginIdentifier = email.toLowerCase();
    user.lastLoginIp = clientIp;
    user.lastLoginUserAgent = userAgent;
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Set cookie with 30-day expiry
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Changed from 'strict' to 'lax' for better cross-site compatibility
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

/**
 * Get current user
 * @route GET /api/auth/me
 */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Split name into firstName and lastName
    const nameParts = (user.name || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          firstName: firstName,
          lastName: lastName,
          email: user.email,
          phone: user.phone,
          phoneVerified: user.phoneVerified || false,
          isPhoneVerified: user.phoneVerified || false, // Alias for frontend compatibility
          phoneVerifiedAt: user.phoneVerifiedAt || null,
          role: user.role,
          photoURL: user.photoURL,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

/**
 * Logout user
 * @route POST /api/auth/logout
 */
export const logout = async (req, res) => {
  // Clear cookie with same options as login (for proper deletion)
  res.cookie('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0, // Immediately expire
    expires: new Date(0),
  });

  res.json({
    success: true,
    message: 'Logged out successfully',
  });
};

/**
 * Google Authentication
 * @route POST /api/auth/google
 */
export const googleAuth = async (req, res) => {
  try {
    // Check if database is connected
    if (!isDBConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database is not available. Please try again later.',
        errorCode: 'DATABASE_UNAVAILABLE',
      });
    }

    const { idToken, email, name, photoURL } = req.body;

    if (!email || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email and name are required for Google authentication.',
        errorCode: 'MISSING_GOOGLE_DATA',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check for existing user by email (this handles account linking)
    let user = await findUserByEmail(normalizedEmail);

    // Track login audit information
    const clientIp = getClientIp(req);
    const userAgent = getClientUserAgent(req);

    if (user) {
      // User exists - link Google provider and update info
      await linkAuthProvider(user, 'google');
      
      if (!user.googleId && idToken) {
        user.googleId = idToken; // Store Firebase UID or token identifier
      }
      if (photoURL && !user.photoURL) {
        user.photoURL = photoURL;
      }
      if (name && user.name !== name) {
        user.name = name; // Update name if changed
      }
    } else {
      // Create new user with Google auth
      user = await User.create({
        name,
        email: normalizedEmail,
        googleId: idToken || `google_${normalizedEmail}`, // Use email as fallback identifier
        photoURL: photoURL || undefined,
        authProviders: ['google'],
        // No password required for Google-authenticated users
      });
    }

    // Update login audit information
    user.lastLoginAt = new Date();
    user.lastLoginMethod = 'google';
    user.lastLoginIdentifier = normalizedEmail;
    user.lastLoginIp = clientIp;
    user.lastLoginUserAgent = userAgent;
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Set cookie with 30-day expiry
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Changed from 'strict' to 'lax' for better cross-site compatibility
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.json({
      success: true,
      message: 'Google authentication successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          photoURL: user.photoURL,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during Google authentication',
    });
  }
};

/**
 * Send OTP for login (public endpoint)
 * @route POST /api/auth/otp/send
 */
export const sendLoginOTP = async (req, res) => {
  try {
    // Check if database is connected
    if (!isDBConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database is not available. Please try again later.',
        errorCode: 'DATABASE_UNAVAILABLE',
      });
    }

    const { phone } = req.body;
    const otpConfig = getOTPConfig();

    // Normalize and validate phone
    const cleanPhone = normalizePhone(phone);
    if (!cleanPhone || !isValidIndianPhone(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number. Please enter a valid 10-digit Indian mobile number.',
        errorCode: 'INVALID_PHONE',
      });
    }

    const maskedPhone = maskPhone(cleanPhone);
    console.log(`[sendLoginOTP] Sending OTP to ${maskedPhone}`);

    // Check resend cooldown
    const lastOTP = await OTP.findOne({ 
      phone: cleanPhone, 
      purpose: 'LOGIN' 
    }).sort({ createdAt: -1 });

    if (lastOTP) {
      const timeSinceLastOTP = Date.now() - lastOTP.createdAt.getTime();
      const cooldownMs = otpConfig.resendCooldownSeconds * 1000;
      
      if (timeSinceLastOTP < cooldownMs) {
        const waitTime = Math.ceil((cooldownMs - timeSinceLastOTP) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait ${waitTime} seconds before requesting a new OTP`,
          waitTime,
          cooldownSeconds: waitTime,
        });
      }
    }

    // Generate 6-digit OTP
    const otp = generateOTP();

    // Delete any existing OTP for this phone and purpose
    await OTP.deleteMany({ phone: cleanPhone, purpose: 'LOGIN' });

    // Save new OTP with configurable expiry
    const expiresAt = new Date(Date.now() + otpConfig.expiryMinutes * 60 * 1000);
    await OTP.create({
      phone: cleanPhone,
      otp,
      purpose: 'LOGIN',
      expiresAt,
    });

    // Send OTP via SMS
    const smsResult = await sendOTP(cleanPhone, otp);

    if (!smsResult.success) {
      // Delete OTP if SMS failed
      await OTP.deleteMany({ phone: cleanPhone, purpose: 'LOGIN' });
      
      return res.status(500).json({
        success: false,
        message: smsResult.message || 'Failed to send OTP. Please try again.',
        errorCode: smsResult.errorCode || 'OTP_SEND_ERROR',
      });
    }

    // Prepare response
    const responseData = {
      phone: maskedPhone,
      expiresIn: otpConfig.expiryMinutes * 60,
      cooldownSeconds: otpConfig.resendCooldownSeconds,
    };

    // In test mode, include OTP in response
    if (otpConfig.testMode && smsResult.data && smsResult.data.otp) {
      responseData.testMode = true;
      responseData.otp = smsResult.data.otp;
    }

    res.json({
      success: true,
      message: 'OTP sent successfully',
      data: responseData,
    });
  } catch (error) {
    console.error('Send login OTP error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send OTP',
    });
  }
};

/**
 * Verify OTP and login (public endpoint)
 * @route POST /api/auth/otp/verify
 */
export const verifyLoginOTP = async (req, res) => {
  try {
    // Check if database is connected
    if (!isDBConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database is not available. Please try again later.',
        errorCode: 'DATABASE_UNAVAILABLE',
      });
    }

    const { phone, otp } = req.body;
    const otpConfig = getOTPConfig();

    // Normalize and validate phone
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

    // Find OTP record
    const otpRecord = await OTP.findOne({ 
      phone: cleanPhone, 
      purpose: 'LOGIN' 
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired or not found. Please request a new OTP.',
        errorCode: 'OTP_NOT_FOUND',
      });
    }

    // Check max attempts
    if (otpRecord.attempts >= otpConfig.maxAttempts) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(423).json({
        success: false,
        message: 'Too many wrong attempts. Please request a new OTP.',
        errorCode: 'OTP_LOCKED',
      });
    }

    // Check expiry
    if (otpRecord.expiresAt < new Date()) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new OTP.',
        errorCode: 'OTP_EXPIRED',
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
        errorCode: 'INVALID_OTP',
      });
    }

    // OTP Valid - Delete it
    await OTP.deleteOne({ _id: otpRecord._id });

    // Find or create user by phone (excluding merged accounts)
    let user = await findUserByPhone(cleanPhone);
    const isNewUser = !user;

    if (!user) {
      // Create new user with phone only (email optional, can be added later)
      // Use a unique temporary email that can be updated later
      const tempEmail = `phone_${cleanPhone}@temp.ozme.in`;
      
      // Check if temp email already exists (shouldn't happen, but be safe)
      let existingUserWithTempEmail = await findUserByEmail(tempEmail);
      if (existingUserWithTempEmail) {
        // If temp email exists, use a different format
        const altTempEmail = `user_${cleanPhone}_${Date.now()}@temp.ozme.in`;
        user = await User.create({
          name: `User ${cleanPhone.slice(-4)}`, // Temporary name
          email: altTempEmail,
          phone: cleanPhone,
          phoneVerified: true,
          phoneVerifiedAt: new Date(),
          password: null, // No password for OTP login
          authProviders: ['otp'],
        });
      } else {
        user = await User.create({
          name: `User ${cleanPhone.slice(-4)}`, // Temporary name
          email: tempEmail,
          phone: cleanPhone,
          phoneVerified: true,
          phoneVerifiedAt: new Date(),
          password: null, // No password for OTP login
          authProviders: ['otp'],
        });
      }
    } else {
      // Existing user - update phone verification if needed
      if (!user.phoneVerified) {
        user.phoneVerified = true;
        user.phoneVerifiedAt = new Date();
      }
      // Link OTP provider if not already linked
      await linkAuthProvider(user, 'otp');
    }

    // Track login audit information
    const clientIp = getClientIp(req);
    const userAgent = getClientUserAgent(req);
    const loginIdentifier = formatPhoneE164(cleanPhone);

    user.lastLoginAt = new Date();
    user.lastLoginMethod = 'otp';
    user.lastLoginIdentifier = loginIdentifier || `+91${cleanPhone}`;
    user.lastLoginIp = clientIp;
    user.lastLoginUserAgent = userAgent;
    await user.save();

    // Generate token and set session
    const token = generateToken(user._id);

    // Set cookie with 30-day expiry
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.json({
      success: true,
      message: 'OTP verified successfully',
      isNewUser,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          phoneVerified: user.phoneVerified,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Verify login OTP error:', error);
    
    // Handle duplicate phone error
    if (error.code === 11000 && error.keyPattern?.phone) {
      return res.status(409).json({
        success: false,
        message: 'This phone number is already registered',
        errorCode: 'PHONE_EXISTS',
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to verify OTP',
    });
  }
};

/**
 * Update user email (for new OTP users)
 * @route POST /api/auth/profile/email
 */
export const updateProfileEmail = async (req, res) => {
  try {
    // Check if database is connected
    if (!isDBConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database is not available. Please try again later.',
        errorCode: 'DATABASE_UNAVAILABLE',
      });
    }

    // This endpoint requires authentication
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        errorCode: 'UNAUTHORIZED',
      });
    }

    const { email } = req.body;

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
        errorCode: 'INVALID_EMAIL',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        errorCode: 'USER_NOT_FOUND',
      });
    }

    // Check if email is already taken by another user (excluding merged accounts)
    const existingUserWithEmail = await findUserByEmail(normalizedEmail);

    if (existingUserWithEmail && existingUserWithEmail._id.toString() !== user._id.toString()) {
      // Email exists on another account - merge accounts
      // Primary account is the one with the email (existingUserWithEmail)
      // Current user becomes secondary
      
      // Check which account is older
      const isCurrentUserOlder = user.createdAt < existingUserWithEmail.createdAt;
      const primaryUser = isCurrentUserOlder ? user : existingUserWithEmail;
      const secondaryUser = isCurrentUserOlder ? existingUserWithEmail : user;
      
      // Merge accounts
      const mergedUser = await mergeAccounts(primaryUser, secondaryUser);
      
      // Update email on primary account if needed
      if (mergedUser.email !== normalizedEmail) {
        mergedUser.email = normalizedEmail;
        await mergedUser.save();
      }
      
      // Return merged user info
      return res.json({
        success: true,
        message: 'Email updated and accounts merged successfully',
        data: {
          user: {
            id: mergedUser._id,
            name: mergedUser.name,
            email: mergedUser.email,
            phone: mergedUser.phone,
            phoneVerified: mergedUser.phoneVerified,
            role: mergedUser.role,
            authProviders: mergedUser.authProviders,
          },
        },
      });
    }

    // Update email (no conflict)
    user.email = normalizedEmail;
    
    // Link email provider
    await linkAuthProvider(user, 'email');
    
    // Check for and merge any duplicate accounts with this email
    await checkAndMergeDuplicates(normalizedEmail);
    
    // Refresh user from DB in case merge happened
    user = await User.findById(user._id);
    
    await user.save();

    res.json({
      success: true,
      message: 'Email updated successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          phoneVerified: user.phoneVerified,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error('Update profile email error:', error);
    
    if (error.code === 11000 && error.keyPattern?.email) {
      return res.status(409).json({
        success: false,
        message: 'This email is already registered',
        errorCode: 'EMAIL_EXISTS',
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update email',
    });
  }
};

