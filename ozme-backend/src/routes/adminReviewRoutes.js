import express from 'express';
import {
  getAdminReviews,
  getAdminReview,
  updateReviewStatus,
  deleteReview,
  getReviewStats,
} from '../controllers/adminReviewController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require admin authentication
router.use(protect, admin);

// Get review stats
router.get('/stats', getReviewStats);

// Get all reviews with filters and pagination
router.get('/', getAdminReviews);

// Get single review
router.get('/:id', getAdminReview);

// Update review status (Approve, Hide, Pending)
router.patch('/:id/status', updateReviewStatus);

// Delete review
router.delete('/:id', deleteReview);

export default router;




