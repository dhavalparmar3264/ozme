import express from 'express';
import {
    getAllCoupons,
    getCouponById,
    createCoupon,
    updateCoupon,
    deleteCoupon,
} from '../controllers/couponController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin routes
router.use(protect, admin);

router.route('/').get(getAllCoupons).post(createCoupon);

router.route('/:id').get(getCouponById).put(updateCoupon).delete(deleteCoupon);

export default router;
