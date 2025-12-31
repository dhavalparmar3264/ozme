# OZME Project Analysis

**Generated:** $(date)  
**Project Path:** `/var/www/ozme_production/OZME`

---

## 📋 Executive Summary

**OZME** is a full-stack e-commerce platform for perfumery products, built with a modern tech stack. The project consists of three main components:

1. **Backend API** (Node.js + Express + MongoDB)
2. **Frontend** (React + Vite)
3. **Admin Dashboard** (React + TypeScript)

The platform supports multiple payment gateways, guest checkout, order tracking, and comprehensive admin management features.

---

## 🏗️ Architecture Overview

### Project Structure

```
OZME/
├── ozme-backend/          # Backend API Server
├── Ozme-frontend/         # Customer-facing Frontend
└── Ozem-Admin/            # Admin Dashboard
```

### Technology Stack

#### Backend (`ozme-backend`)
- **Runtime:** Node.js (ES Modules)
- **Framework:** Express.js 4.18.2
- **Database:** MongoDB with Mongoose 8.0.3
- **Authentication:** JWT (jsonwebtoken 9.0.2)
- **Validation:** express-validator 7.0.1
- **File Upload:** Multer 2.0.2, Cloudinary 2.8.0
- **Email:** Nodemailer 6.9.7
- **Payment Gateways:**
  - PhonePe (pg-sdk-node)
  - Razorpay 2.9.6
  - Cashfree (legacy support)
- **Security:** bcryptjs 2.4.3, CORS enabled
- **Dev Tools:** ESLint, Jest, Nodemon, Prettier

#### Frontend (`Ozme-frontend`)
- **Framework:** React 19.2.0
- **Build Tool:** Vite (rolldown-vite 7.2.2)
- **Routing:** React Router DOM 7.9.6
- **Styling:** Tailwind CSS 4.1.17
- **State Management:** React Context API
- **UI Libraries:** 
  - Lucide React 0.554.0
  - React Icons 5.5.0
  - React Hot Toast 2.6.0
- **Other:** Firebase 12.6.0, jsPDF 3.0.4, React CountUp 6.5.3

#### Admin Dashboard (`Ozem-Admin`)
- **Framework:** React 18.3.1 + TypeScript 5.5.3
- **Build Tool:** Vite 5.4.2
- **Styling:** Tailwind CSS 3.4.1
- **Icons:** Heroicons React 2.2.0, Lucide React 0.344.0
- **Database:** Supabase JS 2.57.4 (for admin features)

---

## 🔑 Core Features

### Customer Features
1. **Authentication & User Management**
   - JWT-based authentication
   - User registration/login
   - Guest mode support (cart & wishlist)
   - User profile management

2. **Product Catalog**
   - Product browsing with filters
   - Category-based navigation (Oriental, Floral, Woody, etc.)
   - Gender filtering (Men, Women, Unisex)
   - Price range filtering
   - Search functionality
   - Product reviews and ratings
   - Product tags (Bestseller, New, Limited)

3. **Shopping Features**
   - Shopping cart (supports logged-in users and guests)
   - Wishlist functionality
   - Product quick view modal
   - Product detail pages

4. **Order Management**
   - Order creation from cart
   - Multiple payment methods (COD, Prepaid)
   - Order tracking by ID or tracking number
   - Order history
   - Order status updates

5. **Payment Integration**
   - **PhonePe** (Primary - SDK-based)
   - **Razorpay** (Alternative)
   - **Cashfree** (Legacy support)
   - Payment status verification
   - Webhook support for payment callbacks

6. **Additional Features**
   - Coupon/discount codes
   - Newsletter subscription
   - Contact form with email notifications
   - FAQ section
   - Policy pages (Privacy, Refund, Shipping, Terms)
   - Order success page
   - Search results page

### Admin Features
1. **Dashboard**
   - Admin authentication
   - Dashboard analytics
   - Order management
   - User management

2. **Product Management**
   - CRUD operations for products
   - Category management
   - Image upload via Cloudinary
   - Inventory management

3. **Order Management**
   - View all orders
   - Update order status
   - Track order delivery
   - Manage shipping information

4. **Content Management**
   - FAQ management
   - Policy page management
   - Review moderation
   - Coupon management

---

## 📊 Database Schema

### Core Models

1. **User** (`User.js`)
   - User authentication and profile data
   - Password hashing with bcrypt

2. **Product** (`Product.js`)
   - Product details (name, description, price, images)
   - Category, gender, size variants
   - Stock management
   - Ratings and reviews count

3. **Order** (`Order.js`)
   - Order items (product references)
   - Shipping address
   - Payment information (method, status, gateway)
   - Order status tracking
   - Delivery tracking (courier, tracking number)
   - Timestamps for order lifecycle

4. **CartItem** (`CartItem.js`)
   - Guest and authenticated user cart support
   - Product references with quantity

5. **WishlistItem** (`WishlistItem.js`)
   - Guest and authenticated user wishlist support

6. **Review** (`Review.js`)
   - Product reviews and ratings
   - User reviews

7. **Category** (`Category.js`)
   - Product categories

8. **Coupon** (`Coupon.js`)
   - Discount codes and promotions

9. **Contact** (`Contact.js`)
   - Contact form submissions

10. **FAQ** (`Faq.js`)
    - Frequently asked questions

11. **Policy** (`Policy.js`)
    - Policy pages content

12. **NewsletterSubscriber** (`NewsletterSubscriber.js`)
    - Newsletter email subscriptions

13. **OTP** (`OTP.js`)
    - OTP verification (if implemented)

---

## 🔌 API Architecture

### Backend Routes Structure

#### Public Routes
- `/api/health` - Health check
- `/api/products` - Product listing with filters
- `/api/products/:id` - Product details
- `/api/faqs` - FAQ listing
- `/api/policies/:type` - Policy pages
- `/api/contact` - Contact form submission
- `/api/reviews` - Product reviews
- `/api/coupons` - Coupon validation
- `/api/newsletter` - Newsletter subscription

#### Authentication Routes (`/api/auth`)
- `POST /register` - User registration
- `POST /login` - User login
- `GET /me` - Get current user (protected)
- `POST /logout` - Logout

#### Cart Routes (`/api/cart`)
- `GET /` - Get cart (optional auth)
- `POST /` - Add item to cart
- `PATCH /:itemId` - Update cart item
- `DELETE /:itemId` - Remove item
- `DELETE /` - Clear cart

#### Wishlist Routes (`/api/wishlist`)
- `GET /` - Get wishlist
- `POST /` - Add to wishlist
- `DELETE /:productId` - Remove from wishlist
- `GET /check/:productId` - Check if in wishlist

#### Order Routes (`/api/orders`)
- `POST /` - Create order (protected)
- `GET /user` - Get user orders (protected)
- `GET /:id` - Get order by ID (protected)
- `GET /track/:identifier` - Track order

#### Payment Routes (`/api/payments`)
- `POST /phonepe/create` - Create PhonePe payment (protected)
- `POST /phonepe/callback` - PhonePe webhook (public)
- `GET /phonepe/verify/:orderId` - Verify payment (protected)
- `POST /razorpay/create` - Create Razorpay payment
- `POST /cashfree/create` - Create Cashfree payment (legacy)

#### Admin Routes (`/api/admin/*`)
- `/admin/auth` - Admin authentication
- `/admin/products` - Product CRUD
- `/admin/orders` - Order management
- `/admin/users` - User management
- `/admin/dashboard` - Dashboard data
- `/admin/categories` - Category management
- `/admin/coupons` - Coupon management
- `/admin/reviews` - Review management

---

## 🔐 Security Features

1. **Authentication**
   - JWT tokens with expiration
   - Separate admin JWT secrets
   - Guest token support for cart/wishlist
   - Password hashing with bcryptjs

2. **Authorization**
   - Protected routes with middleware
   - Admin-only routes
   - User-specific data access

3. **CORS Configuration**
   - Configured for production domains
   - Credentials enabled
   - Development mode allows all origins

4. **Input Validation**
   - express-validator for request validation
   - Mongoose schema validation
   - Request sanitization

5. **Payment Security**
   - Signature verification for payment callbacks
   - Webhook secret validation
   - Secure payment gateway integration

---

## 💳 Payment Gateway Integration

### PhonePe (Primary)
- **Status:** ✅ Active (SDK-based integration)
- **Mode:** Supports UAT and PROD
- **Implementation:** 
  - SDK-based credentials (Merchant ID, Client ID, Client Secret)
  - Signature generation with SHA256
  - Webhook callback support
  - Payment verification endpoint
- **Files:**
  - `ozme-backend/src/utils/phonepe.js`
  - `ozme-backend/src/utils/phonepeUat.js`
  - `ozme-backend/src/controllers/paymentController.js`

### Razorpay (Alternative)
- **Status:** ✅ Available
- **Implementation:** Razorpay SDK integration
- **Files:** `ozme-backend/src/utils/razorpay.js`

### Cashfree (Legacy)
- **Status:** ⚠️ Legacy support (replaced by PhonePe)
- **Note:** Routes preserved for backward compatibility

---

## 📧 Email Integration

- **Service:** Nodemailer
- **Features:**
  - SMTP configuration
  - Order confirmation emails
  - Contact form notifications
  - Newsletter emails
  - Admin notifications
- **Configuration:** Environment variables
- **Files:**
  - `ozme-backend/src/utils/sendEmail.js`
  - `ozme-backend/src/utils/orderEmails.js`

---

## 🖼️ Media Management

- **Service:** Cloudinary
- **Features:**
  - Product image uploads
  - Image optimization
  - Multiple image support per product
- **Configuration:** Environment variables
- **Files:** `ozme-backend/src/utils/cloudinary.js`

---

## 🧪 Testing & Quality

### Testing
- **Framework:** Jest 29.7.0
- **Test Location:** `ozme-backend/src/__tests__/`
- **Coverage:** Available via Jest

### Code Quality
- **Linting:** ESLint configured
- **Formatting:** Prettier configured
- **Current Status:** ✅ No linter errors found

### Debugging
- Debug endpoints for email testing
- Server health check endpoint
- Detailed error logging in development mode

---

## 📝 Documentation

### Existing Documentation
1. `PROJECT_STRUCTURE.md` - Project structure overview
2. `PHONEPE_INTEGRATION.md` - PhonePe integration guide
3. `PHONEPE_SDK_INTEGRATION_COMPLETE.md` - SDK integration details
4. `PHONEPE_UAT_MODE_ENABLED.md` - UAT mode configuration
5. `PHONEPE_404_TROUBLESHOOTING.md` - Troubleshooting guide
6. `TROUBLESHOOT_CASHFREE_500.md` - Cashfree troubleshooting
7. `EMAIL_TROUBLESHOOTING.md` - Email configuration guide
8. `EMAIL_FIX_SUMMARY.md` - Email fix documentation
9. Backend and Frontend README files

---

## ⚙️ Environment Configuration

### Backend Environment Variables

**Required:**
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - JWT token secret
- `CLIENT_URL` - Frontend URL
- `PORT` - Server port (default: 3002)

**Payment Gateways:**
- PhonePe: `PHONEPE_MERCHANT_ID`, `PHONEPE_CLIENT_ID`, `PHONEPE_CLIENT_SECRET`, `PHONEPE_CLIENT_VERSION`, `PHONEPE_ENV`
- PhonePe UAT: `PHONEPE_UAT_MERCHANT_ID`, `PHONEPE_UAT_SALT_KEY`, `PHONEPE_UAT_SALT_INDEX`
- Razorpay: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
- Cashfree: `CASHFREE_CLIENT_ID`, `CASHFREE_CLIENT_SECRET` (legacy)

**Email:**
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_FROM`
- `ADMIN_EMAIL` or `ADMIN_NOTIFY_EMAIL`

**Cloudinary:**
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

**Other:**
- `NODE_ENV` - Environment (development/production)
- `API_BASE_URL` - API base URL

### Frontend Environment Variables
- `VITE_API_BASE_URL` - Backend API URL

---

## 🚀 Deployment

### Production Configuration
- **Backend Port:** 3002 (configurable)
- **Frontend:** Built with Vite, served statically
- **Admin:** Built with Vite, served statically
- **Domain:** https://ozme.in

### Server Setup
- Server logs: `ozme-backend/server.log`
- Health check: `/api/health`
- Auto-restart: Nodemon in development

---

## 🔍 Code Quality Observations

### Strengths
1. ✅ Well-organized project structure
2. ✅ Separation of concerns (controllers, routes, models, utils)
3. ✅ Comprehensive feature set
4. ✅ Multiple payment gateway support
5. ✅ Guest mode support for cart/wishlist
6. ✅ TypeScript in admin panel
7. ✅ Modern React patterns (Context API, Hooks)
8. ✅ Comprehensive documentation
9. ✅ Error handling middleware
10. ✅ Input validation

### Areas for Improvement
1. ⚠️ **Typo in directory name:** `componets` should be `components` (found in frontend)
2. ⚠️ **Payment Gateway Migration:** Cashfree marked as legacy but still referenced in docs
3. ⚠️ **Environment Variables:** Many required variables, could benefit from `.env.example` files
4. ⚠️ **Testing:** Test files exist but coverage unknown
5. ⚠️ **TypeScript:** Only admin panel uses TypeScript; frontend uses JavaScript
6. ⚠️ **Error Handling:** Some error messages expose details in development mode (good for dev, ensure production safety)

### Potential Issues
1. **Payment Gateway Priority:** Multiple payment gateways configured; ensure clear fallback logic
2. **Guest Token Management:** Guest tokens stored in cookies; ensure proper expiration
3. **Image Upload:** Cloudinary integration; ensure proper error handling for failed uploads
4. **Email Configuration:** Multiple email-related environment variables; ensure consistent configuration

---

## 📈 Recommendations

### Short-term
1. Fix directory name typo (`componets` → `components`)
2. Create `.env.example` files for all three components
3. Add comprehensive error logging
4. Document API endpoints with OpenAPI/Swagger

### Medium-term
1. Add unit tests for critical payment flows
2. Implement rate limiting for API endpoints
3. Add request logging middleware
4. Implement proper error tracking (e.g., Sentry)

### Long-term
1. Migrate frontend to TypeScript
2. Implement comprehensive test coverage
3. Add API versioning
4. Implement caching strategy
5. Add monitoring and analytics

---

## 🎯 Key Metrics

- **Backend Controllers:** 20+
- **API Routes:** 15+ route files
- **Database Models:** 13 models
- **Frontend Pages:** 15+ pages
- **Payment Gateways:** 3 (PhonePe primary, Razorpay, Cashfree legacy)
- **Dependencies:** ~40 backend, ~20 frontend, ~15 admin

---

## 📞 Support & Maintenance

- **Production Domain:** https://ozme.in
- **Support Email:** support@ozme.in (from code references)
- **Admin Email:** notify@ozme.in (from code references)
- **Server Logs:** `/var/www/ozme_production/OZME/ozme-backend/server.log`

---

## ✅ Conclusion

The OZME project is a well-structured, feature-rich e-commerce platform with modern technologies and comprehensive functionality. The codebase shows good organization and follows best practices. The platform is production-ready with proper payment integration, user management, and admin capabilities.

**Overall Assessment:** ⭐⭐⭐⭐ (4/5)

**Production Readiness:** ✅ Ready (with proper environment configuration)

---

*Analysis completed. For specific questions or deeper analysis of any component, please refer to the individual documentation files or request detailed analysis of specific areas.*

