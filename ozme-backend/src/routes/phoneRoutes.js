import express from 'express';
import {
  sendPhoneOTP,
  verifyPhoneOTP,
  resendPhoneOTP,
  getPhoneStatus,
} from '../controllers/phoneController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Phone verification routes
router.post('/send-otp', sendPhoneOTP);
router.post('/verify-otp', verifyPhoneOTP);
router.post('/resend-otp', resendPhoneOTP);
router.get('/status', getPhoneStatus);

export default router;


