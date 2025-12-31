import express from 'express';
import {
    createPaymentOrder,
    verifyPayment,
    handlePaymentFailure,
    createCashfreePayment,
    handleCashfreeWebhook,
    getCashfreePaymentStatus,
    initiatePhonePePayment,
    phonepeCallback,
    phonepeVerifyPayment,
    phonepeGetPaymentStatus,
} from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Razorpay payment routes (kept for backward compatibility)
router.post('/razorpay/create-order', protect, createPaymentOrder);
router.post('/razorpay/verify', protect, verifyPayment);
router.post('/razorpay/failed', protect, handlePaymentFailure);

// Cashfree payment routes (kept for backward compatibility)
router.post('/cashfree/create', protect, createCashfreePayment);
router.post('/cashfree/webhook', handleCashfreeWebhook); // Public - webhook endpoint
router.get('/cashfree/status/:orderId', protect, getCashfreePaymentStatus);

// PhonePe payment routes (PROD Pay Page - Checksum/Salt flow)
router.post('/phonepe/create', protect, initiatePhonePePayment);
router.post('/phonepe/callback', phonepeCallback); // Public - callback/webhook endpoint
router.get('/phonepe/status/:merchantTransactionId', phonepeGetPaymentStatus); // Public - status check for success page
router.get('/phonepe/verify/:orderId', protect, phonepeVerifyPayment); // Legacy endpoint

export default router;
