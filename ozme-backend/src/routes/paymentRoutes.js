import express from 'express';
import {
    createPaymentOrder,
    verifyPayment,
    handlePaymentFailure,
} from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Razorpay payment routes
router.post('/razorpay/create-order', protect, createPaymentOrder);
router.post('/razorpay/verify', protect, verifyPayment);
router.post('/razorpay/failed', protect, handlePaymentFailure);

export default router;
