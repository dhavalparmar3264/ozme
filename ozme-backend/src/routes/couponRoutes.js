import express from 'express';
import { validateCoupon } from '../controllers/couponController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// User coupon validation route
router.post('/validate', protect, validateCoupon);

export default router;
