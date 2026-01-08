import express from 'express';
import { submitContact } from '../controllers/contactController.js';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest.js';

const router = express.Router();

const contactValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('message').trim().notEmpty().withMessage('Message is required'),
  body('category').optional().isIn(['general', 'order', 'product', 'feedback', 'other']),
];

router.post('/', contactValidation, validateRequest, submitContact);

export default router;

