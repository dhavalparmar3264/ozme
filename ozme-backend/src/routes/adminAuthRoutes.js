import express from 'express';
import { adminLogin, getAdminMe, adminLogout } from '../controllers/adminAuthController.js';
import { adminProtect } from '../middleware/adminAuthMiddleware.js';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest.js';

const router = express.Router();

const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

router.post('/login', loginValidation, validateRequest, adminLogin);
router.get('/me', adminProtect, getAdminMe);
router.post('/logout', adminProtect, adminLogout);

export default router;

