import express from 'express';
import { getAdminDashboard, getAdminDashboardSummary } from '../controllers/adminDashboardController.js';
import { adminProtect } from '../middleware/adminAuthMiddleware.js';

const router = express.Router();

// All routes require admin authentication
router.use(adminProtect);

// Main dashboard endpoint - returns all metrics in one response
router.get('/', getAdminDashboard);

// Stats endpoint (alias for main dashboard)
router.get('/stats', getAdminDashboard);

// Legacy summary endpoint (kept for backward compatibility)
router.get('/summary', getAdminDashboardSummary);

export default router;

