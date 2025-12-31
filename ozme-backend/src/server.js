import 'dotenv/config'; // Must be first - loads env vars before other imports
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB, { isDBConnected } from './config/db.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { verifySMTPConnection } from './utils/sendEmail.js';

// Import Routes
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import faqRoutes from './routes/faqRoutes.js';
import policyRoutes from './routes/policyRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import userRoutes from './routes/userRoutes.js';

// Admin Routes
import adminAuthRoutes from './routes/adminAuthRoutes.js';
import adminProductRoutes from './routes/adminProductRoutes.js';
import adminOrderRoutes from './routes/adminOrderRoutes.js';
import adminDashboardRoutes from './routes/adminDashboardRoutes.js';
import adminCouponRoutes from './routes/adminCouponRoutes.js';
import adminCategoryRoutes from './routes/adminCategoryRoutes.js';
import adminReviewRoutes from './routes/adminReviewRoutes.js';
import adminUserRoutes from './routes/adminUserRoutes.js';
import phoneRoutes from './routes/phoneRoutes.js';

// Payment, Coupon & Review Routes
import paymentRoutes from './routes/paymentRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import newsletterRoutes from './routes/newsletterRoutes.js';
import emailRoutes from './routes/emailRoutes.js';
import { testEmail } from './controllers/testEmailController.js';

// Load environment variables
// dotenv is loaded via import 'dotenv/config' at top

// Connect to MongoDB (non-blocking - server will start even if DB is down)
connectDB().catch((err) => {
  console.error('Failed to connect to MongoDB:', err.message);
  // Server will continue to start
});

// Verify SMTP connection on startup (non-blocking)
verifySMTPConnection().catch((err) => {
  console.error('SMTP verification error:', err.message);
  // Server will continue to start
});

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
const allowedOrigins = [
  process.env.CLIENT_URL || 'https://ozme.in',
  process.env.ADMIN_CLIENT_URL || 'https://ozme.in',
  'https://ozme.in',
  'https://www.ozme.in',
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins in development
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'OZME Backend API is running',
    database: isDBConnected() ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// Test Email Endpoints (for debugging)
app.get('/api/test-email', testEmail); // Legacy endpoint
app.use('/api/email', emailRoutes); // New email routes (includes /api/email/test)

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/faqs', faqRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/newsletter', newsletterRoutes);

// Admin API Routes
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/products', adminProductRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/admin/dashboard', adminDashboardRoutes);
app.use('/api/admin/coupons', adminCouponRoutes);
app.use('/api/admin/categories', adminCategoryRoutes);
app.use('/api/admin/reviews', adminReviewRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/phone', phoneRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 OZME Backend Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Log email configuration (without password)
  if (process.env.EMAIL_HOST) {
    console.log(`📧 Email Config: ${process.env.EMAIL_HOST}:${process.env.EMAIL_PORT || 587}`);
  }
  
  // Log PhonePe PROD configuration (without secrets)
  if (process.env.PHONEPE_MERCHANT_ID) {
    console.log(`💳 PhonePe Configuration:`);
    console.log(`   MODE: ${process.env.PHONEPE_MODE || 'NOT SET (defaults to PROD)'}`);
    console.log(`   BASE_URL: ${process.env.PHONEPE_BASE_URL || 'https://api.phonepe.com/apis/hermes (default)'}`);
    console.log(`   MERCHANT_ID: ${process.env.PHONEPE_MERCHANT_ID?.substring(0, 10)}...`);
    console.log(`   CLIENT_ID: ${process.env.PHONEPE_CLIENT_ID?.substring(0, 10)}...`);
    console.log(`   SALT_KEY: ${process.env.PHONEPE_SALT_KEY ? '✓ Set (length: ' + process.env.PHONEPE_SALT_KEY.length + ')' : '✗ NOT SET (REQUIRED for X-VERIFY signature)'}`);
    console.log(`   SALT_INDEX: ${process.env.PHONEPE_SALT_INDEX || 'NOT SET (defaults to "1")'}`);
    console.log(`   RETURN_URL: ${process.env.PHONEPE_RETURN_URL || 'NOT SET'}`);
    console.log(`   CALLBACK_URL: ${process.env.PHONEPE_CALLBACK_URL || 'NOT SET'}`);
    console.log(`   Integration Style: SDK-based (X-VERIFY uses SALT_KEY + SALT_INDEX)`);
    
    // Validate PROD mode
    if (process.env.PHONEPE_MODE && process.env.PHONEPE_MODE !== 'PROD') {
      console.error(`   ⚠️  WARNING: PHONEPE_MODE is set to "${process.env.PHONEPE_MODE}" but must be "PROD"`);
    }
    
    // Validate base URL
    const baseURL = process.env.PHONEPE_BASE_URL || 'https://api.phonepe.com/apis/hermes';
    if (baseURL.includes('preprod') || baseURL.includes('sandbox') || baseURL.includes('testing') || baseURL.includes('mercury-uat')) {
      console.error(`   ❌ ERROR: PHONEPE_BASE_URL contains UAT/sandbox indicators: ${baseURL}`);
    }
    
    // Validate SALT_KEY is set
    if (!process.env.PHONEPE_SALT_KEY) {
      console.error(`   ❌ ERROR: PHONEPE_SALT_KEY is REQUIRED for X-VERIFY signature in PROD`);
      console.error(`   Note: Even SDK-based integration uses SALT_KEY (not clientSecret) for signature`);
    }
  } else {
    console.warn(`   ⚠️  PhonePe credentials not configured`);
  }
});

 // Trigger restart
