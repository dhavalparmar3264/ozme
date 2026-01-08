import express from 'express';
import {
  getAdminOrders,
  getAdminOrder,
  updateAdminOrderStatus,
} from '../controllers/adminOrderController.js';
import { adminProtect } from '../middleware/adminAuthMiddleware.js';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest.js';

const router = express.Router();

// All routes require admin authentication
router.use(adminProtect);

const statusValidation = [
  body('orderStatus').optional().isIn(['Pending', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled']),
  body('deliveryStatus').optional().isIn(['Pending', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled']),
  body('paymentStatus').optional().isIn(['Pending', 'Paid', 'Failed', 'Refunded']),
  body('trackingNumber').optional().isString().isLength({ max: 100 }),
  body('courierName').optional().isString().isLength({ max: 100 }),
];

router.get('/', getAdminOrders);
router.get('/:id', getAdminOrder);
router.patch('/:id/status', statusValidation, validateRequest, updateAdminOrderStatus);

export default router;

