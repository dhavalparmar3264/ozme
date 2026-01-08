import express from 'express';
import {
  getAllFeedbackPromoCodes,
  getFeedbackPromoCodeById,
} from '../controllers/feedbackPromoCodeController.js';
import { adminProtect } from '../middleware/adminAuthMiddleware.js';

const router = express.Router();

// All routes require admin authentication
router.use(adminProtect);

router.get('/', getAllFeedbackPromoCodes);
router.get('/:id', getFeedbackPromoCodeById);

export default router;
