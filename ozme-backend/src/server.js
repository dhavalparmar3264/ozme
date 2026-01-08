import 'dotenv/config'; // Must be first - loads env vars before other imports
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB, { isDBConnected, getConnectionInfo } from './config/db.js';
import { getCloudinaryConfig } from './config/cloudinary.js';
import { getOTPConfigStatus } from './config/otp.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { verifySMTPConnection } from './utils/sendEmail.js';
import { bootstrapAdmin } from './utils/bootstrapAdmin.js';

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
import feedbackRoutes from './routes/feedbackRoutes.js';
import emailRoutes from './routes/emailRoutes.js';
import { testEmail } from './controllers/testEmailController.js';

// Load environment variables
// dotenv is loaded via import 'dotenv/config' at top

const app = express();
const PORT = process.env.PORT || 3002;

// Trust proxy for correct IP detection behind reverse proxy (nginx)
app.set('trust proxy', true);

// Middleware
// CORS configuration - must allow credentials for httpOnly cookies
// DO NOT use wildcard (*) with credentials
app.use(cors({
  origin: [
    'https://ozme.in',
    'https://www.ozme.in',
    'http://localhost:3001'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-guest-token']
}));

// Raw body parser for Cashfree webhook (must be before express.json())
// Cashfree webhook signature verification requires raw body string
app.use('/api/payments/cashfree/webhook', express.raw({ type: 'application/json' }));

// Increase body size limit for file uploads (admin product creation with images)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  const dbInfo = getConnectionInfo();
  const cloudinaryConfig = getCloudinaryConfig();
  const otpConfigStatus = getOTPConfigStatus();
  
  res.json({
    status: 'OK',
    message: 'OZME Backend API is running',
    database: isDBConnected() ? 'connected' : 'disconnected',
    dbInfo: dbInfo ? {
      host: dbInfo.host,
      name: dbInfo.name,
    } : null,
    cloudinary: cloudinaryConfig.configured ? {
      status: 'configured',
      cloudName: cloudinaryConfig.cloudName,
    } : {
      status: 'not configured',
    },
    otp: otpConfigStatus.configured ? {
      status: 'configured',
      provider: otpConfigStatus.provider,
    } : {
      status: 'not configured',
    },
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
app.use('/api/feedback', feedbackRoutes);

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

// Connect to MongoDB and start server
// CRITICAL: Try to connect to DB, but start server even if connection fails
// Mongoose buffering is disabled, so queries will fail fast instead of timing out
const startServer = async () => {
  // Step 1: Verify Cloudinary configuration (fail fast)
  // Cloudinary config is loaded on import, so we just check status
  try {
    const cloudinaryConfig = getCloudinaryConfig();
    if (cloudinaryConfig.configured) {
      const apiKey = process.env.CLOUDINARY_API_KEY || '';
      const maskedKey = apiKey ? `${apiKey.substring(0, 6)}...${apiKey.substring(apiKey.length - 4)}` : 'not set';
      console.log('✅ Cloudinary: Configured and ready');
      console.log(`   Cloud Name: ${cloudinaryConfig.cloudName}`);
      console.log(`   API Key: ${maskedKey} (masked)`);
      console.log(`   Status: Cloudinary ready for image uploads`);
    }
  } catch (cloudinaryError) {
    console.error('❌ Cloudinary configuration failed on startup:', cloudinaryError.message);
    console.error('💡 Server will start, but image uploads will fail until Cloudinary is configured');
  }

  // Step 1.5: Verify OTP configuration (fail fast)
  try {
    const otpConfigStatus = getOTPConfigStatus();
    if (otpConfigStatus.configured) {
      console.log('✅ OTP Service: Configured and ready');
      console.log(`   Provider: ${otpConfigStatus.provider}`);
      console.log(`   Status: OTP service ready for SMS sending`);
    }
  } catch (otpError) {
    console.error('❌ OTP configuration failed on startup:', otpError.message);
    console.error('💡 Server will start, but OTP sending will fail until OTP_API_KEY is configured');
  }
  
  // Step 2: Try to connect to MongoDB (non-blocking)
  console.log('🔄 Connecting to MongoDB...');
  try {
    await connectDB();
    
    // Step 3: Bootstrap admin user if flag is set and DB is connected
    if (process.env.ADMIN_BOOTSTRAP === 'true' && isDBConnected()) {
      console.log('🔄 Bootstrapping admin user...');
      await bootstrapAdmin();
    }
  } catch (error) {
    console.error('⚠️  MongoDB connection failed, but server will start anyway');
    console.error('💡 Queries will fail fast instead of timing out (buffering disabled)');
    console.error('💡 Please verify MongoDB Atlas IP whitelist and credentials');
  }
  
  // Step 3: Start server (even if DB connection failed)
  app.listen(PORT, () => {
    console.log(`🚀 OZME Backend Server running on port ${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Log email configuration (without password)
    if (process.env.EMAIL_HOST) {
      console.log(`📧 Email Config: ${process.env.EMAIL_HOST}:${process.env.EMAIL_PORT || 587}`);
    }
    
    // Log Cashfree PROD configuration (without secrets)
    if (process.env.CASHFREE_APP_ID) {
      console.log(`💳 Cashfree Payment Gateway Configuration:`);
      console.log(`   Environment: ${process.env.CASHFREE_ENV || 'PROD'}`);
      console.log(`   BASE_URL: ${process.env.CASHFREE_BASE_URL || 'https://api.cashfree.com/pg (default)'}`);
      console.log(`   APP_ID: ${process.env.CASHFREE_APP_ID?.substring(0, 10)}...`);
      console.log(`   SECRET_KEY: ${process.env.CASHFREE_SECRET_KEY ? '✓ Set (length: ' + process.env.CASHFREE_SECRET_KEY.length + ')' : '✗ NOT SET'}`);
      console.log(`   WEBHOOK_SECRET: ${process.env.CASHFREE_WEBHOOK_SECRET ? '✓ Set (length: ' + process.env.CASHFREE_WEBHOOK_SECRET.length + ')' : '✗ NOT SET'}`);
      console.log(`   RETURN_URL: ${process.env.CASHFREE_RETURN_URL || 'NOT SET'}`);
      console.log(`   CALLBACK_URL: ${process.env.CASHFREE_CALLBACK_URL || 'NOT SET'}`);
      console.log(`   API Version: 2022-09-01`);
      console.log(`   Integration Type: PG Orders API (Production)`);
      console.log(`   Headers: x-client-id, x-client-secret, x-api-version, Content-Type`);
      console.log(`   Webhook Auth: x-webhook-signature (HMAC SHA256)`);
      
      // Validate PROD mode
      if (process.env.CASHFREE_ENV && process.env.CASHFREE_ENV !== 'PROD') {
        console.warn(`   ⚠️  WARNING: CASHFREE_ENV is set to "${process.env.CASHFREE_ENV}" but should be "PROD"`);
      }
      
      // Validate base URL
      const baseURL = process.env.CASHFREE_BASE_URL || 'https://api.cashfree.com/pg';
      if (baseURL.includes('sandbox') || baseURL.includes('test')) {
        console.error(`   ❌ ERROR: CASHFREE_BASE_URL contains sandbox/test indicators: ${baseURL}`);
      }
      
      // Validate credentials
      if (!process.env.CASHFREE_SECRET_KEY) {
        console.error(`   ❌ ERROR: CASHFREE_SECRET_KEY is REQUIRED for PROD integration`);
      }
      
      if (!process.env.CASHFREE_WEBHOOK_SECRET) {
        console.warn(`   ⚠️  WARNING: CASHFREE_WEBHOOK_SECRET not set - webhook signature verification disabled`);
      }
    } else {
      console.warn(`   ⚠️  Cashfree credentials not configured`);
    }
  });
};

// Start the server
startServer();

// Verify SMTP connection on startup (non-blocking)
verifySMTPConnection().catch((err) => {
  console.error('SMTP verification error:', err.message);
  // Server will continue to start
});
