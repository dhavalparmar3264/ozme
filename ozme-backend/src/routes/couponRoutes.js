import express from 'express';
import { validateCoupon } from '../controllers/couponController.js';

const router = express.Router();

// User coupon validation route (no auth required - guest users can apply)
router.post('/validate', validateCoupon);

export default router;
