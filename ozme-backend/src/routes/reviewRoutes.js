import express from 'express';
import {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  getMyReview,
  canReviewProduct,
} from '../controllers/reviewController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route - Get reviews for a product (only approved)
router.get('/product/:productId', getProductReviews);

// Protected routes - require authentication
router.post('/', protect, createReview);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);
router.get('/my/:productId', protect, getMyReview);
router.get('/can-review/:productId', protect, canReviewProduct);

export default router;




