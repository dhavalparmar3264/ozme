import express from 'express';
import {
  sendPhoneOTP,
  verifyPhoneOTP,
  resendPhoneOTP,
  getPhoneStatus,
  changePhoneNumber,
} from '../controllers/phoneController.js';
import { protect } from '../middleware/authMiddleware.js';
import { otpSendRateLimiter, otpVerifyRateLimiter } from '../middleware/otpRateLimiter.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Phone verification routes with rate limiting
router.post('/send-otp', otpSendRateLimiter, sendPhoneOTP);
router.post('/verify-otp', otpVerifyRateLimiter, verifyPhoneOTP);
router.post('/resend-otp', otpSendRateLimiter, resendPhoneOTP);
router.post('/change', changePhoneNumber);
router.get('/status', getPhoneStatus);

export default router;




