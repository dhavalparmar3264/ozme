import express from 'express';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlist,
} from '../controllers/wishlistController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest.js';

const router = express.Router();

// All wishlist routes use optionalAuth (works for both logged in and guest users)
router.use(optionalAuth);

const addToWishlistValidation = [
  body('productId').notEmpty().withMessage('Product ID is required'),
];

router.get('/', getWishlist);
router.post('/', addToWishlistValidation, validateRequest, addToWishlist);
router.delete('/:productId', removeFromWishlist);
router.get('/check/:productId', checkWishlist);

export default router;

