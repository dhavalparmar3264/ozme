import User from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';
import { isDBConnected } from '../config/db.js';

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

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
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

    // Generate token
    const token = generateToken(user._id);

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
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
  res.cookie('token', '', {
    httpOnly: true,
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

    // Find user by email or create new user
    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      // User exists - update Google ID and photo if not set
      if (!user.googleId && idToken) {
        user.googleId = idToken; // Store Firebase UID or token identifier
      }
      if (photoURL && !user.photoURL) {
        user.photoURL = photoURL;
      }
      if (name && user.name !== name) {
        user.name = name; // Update name if changed
      }
      await user.save();
    } else {
      // Create new user with Google auth
      user = await User.create({
        name,
        email: email.toLowerCase(),
        googleId: idToken || `google_${email}`, // Use email as fallback identifier
        photoURL: photoURL || undefined,
        // No password required for Google-authenticated users
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
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

