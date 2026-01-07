import express from 'express';
import { register, login, getMe, logout, googleAuth, sendLoginOTP, verifyLoginOTP, updateProfileEmail } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest.js';
import { otpSendRateLimiter, otpVerifyRateLimiter } from '../middleware/otpRateLimiter.js';

const router = express.Router();

// Validation rules
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),
];

const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

// Routes
router.post('/register', registerValidation, validateRequest, register);
router.post('/login', loginValidation, validateRequest, login);
router.post('/google', googleAuth); // Google authentication (no validation needed, handled by Firebase)

// OTP Login Routes (public)
router.post('/otp/send', otpSendRateLimiter, sendLoginOTP);
router.post('/otp/verify', otpVerifyRateLimiter, verifyLoginOTP);

// Profile update (requires auth)
router.post('/profile/email', protect, updateProfileEmail);

router.get('/me', protect, getMe);
router.post('/logout', logout);

export default router;

