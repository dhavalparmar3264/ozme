import express from 'express';
import { subscribeNewsletter, testNewsletterEmail } from '../controllers/newsletterController.js';

const router = express.Router();

// Public route - no authentication required
router.post('/subscribe', subscribeNewsletter);

// Test endpoint for debugging (public, but can be protected in production)
router.get('/test-email', testNewsletterEmail);

export default router;

