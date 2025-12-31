import express from 'express';
import {
  getAdminUsers,
  getAdminUser,
  getUserStats,
} from '../controllers/adminUserController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require admin authentication
router.use(protect, admin);

// Get user stats
router.get('/stats', getUserStats);

// Get all users with pagination
router.get('/', getAdminUsers);

// Get single user with full details
router.get('/:id', getAdminUser);

export default router;




