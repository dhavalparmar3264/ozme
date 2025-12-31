import express from 'express';
import {
  updateProfile,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Profile update validation
const updateProfileValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('phone').optional().trim(),
];

// Address validation
const addressValidation = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('street').trim().notEmpty().withMessage('Street address is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('state').trim().notEmpty().withMessage('State is required'),
  body('pinCode').trim().notEmpty().withMessage('PIN code is required'),
];

// Routes
router.put('/me', updateProfileValidation, validateRequest, updateProfile);
router.get('/me/addresses', getAddresses);
router.post('/me/addresses', addressValidation, validateRequest, addAddress);
router.put('/me/addresses/:addressId', addressValidation, validateRequest, updateAddress);
router.patch('/me/addresses/:addressId/default', setDefaultAddress);
router.delete('/me/addresses/:addressId', deleteAddress);

export default router;

