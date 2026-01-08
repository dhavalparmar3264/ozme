import express from 'express';
import multer from 'multer';
import {
  getAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  uploadProductImages,
  deleteProductImage,
} from '../controllers/adminProductController.js';
import { adminProtect } from '../middleware/adminAuthMiddleware.js';

const router = express.Router();

// All routes require admin authentication
router.use(adminProtect);

// Configure multer for file uploads (store in memory)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    fieldSize: 10 * 1024 * 1024, // 10MB for fields (productData JSON)
    files: 10, // Maximum 10 files
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// Error handler for multer errors (413, etc.)
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: 'File too large. Maximum file size is 5MB per image.',
        error: 'LIMIT_FILE_SIZE',
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 10 images allowed.',
        error: 'LIMIT_FILE_COUNT',
      });
    }
    return res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`,
      error: err.code,
    });
  }
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload error',
      error: 'UPLOAD_ERROR',
    });
  }
  next();
};

router.get('/', getAdminProducts);
router.post('/upload-images', upload.array('images', 10), handleMulterError, uploadProductImages); // Keep for backward compatibility if needed
router.post('/', upload.array('images', 10), handleMulterError, createAdminProduct);
router.put('/:id', upload.array('images', 10), handleMulterError, updateAdminProduct);

// Image deletion route - MUST come before general delete route to avoid route conflicts
// Express matches routes in order, so more specific routes must be defined first
router.delete('/:productId/images', deleteProductImage);

router.delete('/:id', deleteAdminProduct);

export default router;

