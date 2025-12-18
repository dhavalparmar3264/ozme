import 'dotenv/config'; // Must be first - loads env vars before other imports
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB, { isDBConnected } from './config/db.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

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

// Load environment variables
// dotenv is loaded via import 'dotenv/config' at top

// Connect to MongoDB (non-blocking - server will start even if DB is down)
connectDB().catch((err) => {
  console.error('Failed to connect to MongoDB:', err.message);
  // Server will continue to start
});

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://82.112.231.165:3001',
  process.env.ADMIN_CLIENT_URL || 'http://82.112.231.165:3003',
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
});

 // Trigger restart
