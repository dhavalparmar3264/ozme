import User from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';

/**
 * Admin Login
 * @route POST /api/admin/auth/login
 */
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Find user and include password
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
    }

    // Check password
    const isPasswordMatch = await user.matchPassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Generate token with 1 hour expiry for admin
    const adminTokenExpiry = process.env.ADMIN_JWT_EXPIRE || '1h';
    const token = generateToken(
      user._id, 
      process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET,
      adminTokenExpiry
    );

    // Set httpOnly cookie with 1 hour expiry
    const cookieMaxAge = adminTokenExpiry === '1h' 
      ? 60 * 60 * 1000 // 1 hour in milliseconds
      : 30 * 24 * 60 * 60 * 1000; // Fallback to 30 days if custom expiry
    
    res.cookie('adminToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: cookieMaxAge,
    });

    res.json({
      success: true,
      message: 'Admin login successful',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
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
 * Get current admin user
 * @route GET /api/admin/auth/me
 */
export const getAdminMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
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
 * Admin Logout
 * @route POST /api/admin/auth/logout
 */
export const adminLogout = async (req, res) => {
  try {
    res.cookie('adminToken', '', {
      httpOnly: true,
      expires: new Date(0),
    });

    res.json({
      success: true,
      message: 'Admin logged out successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

