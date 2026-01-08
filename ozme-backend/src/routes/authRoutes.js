import express from 'express';
import { getMe, logout, googleAuth, sendLoginOTP, verifyLoginOTP, updateProfileEmail } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { otpSendRateLimiter, otpVerifyRateLimiter } from '../middleware/otpRateLimiter.js';

const router = express.Router();

// Routes
router.post('/google', googleAuth); // Google authentication (no validation needed, handled by Firebase)

// OTP Login Routes (public)
router.post('/otp/send', otpSendRateLimiter, sendLoginOTP);
router.post('/otp/verify', otpVerifyRateLimiter, verifyLoginOTP);

// Profile update (requires auth)
router.post('/profile/email', protect, updateProfileEmail);

router.get('/me', protect, getMe);
router.post('/logout', logout);

export default router;

