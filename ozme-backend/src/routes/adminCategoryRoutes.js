import express from 'express';
import {
  getAdminCategories,
  getAdminCategory,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
} from '../controllers/adminCategoryController.js';
import { adminProtect } from '../middleware/adminAuthMiddleware.js';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest.js';

const router = express.Router();

// All routes require admin authentication
router.use(adminProtect);

const categoryValidation = [
  body('name').notEmpty().trim().withMessage('Category name is required'),
  body('description').optional().isString().trim(),
  body('active').optional().isBoolean(),
];

router.get('/', getAdminCategories);
router.get('/:id', getAdminCategory);
router.post('/', categoryValidation, validateRequest, createAdminCategory);
router.put('/:id', categoryValidation, validateRequest, updateAdminCategory);
router.delete('/:id', deleteAdminCategory);

export default router;

