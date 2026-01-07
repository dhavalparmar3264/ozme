# OZME Backend API

Backend API server for OZME Perfumery E-commerce Platform built with Node.js, Express, and MongoDB.

## Features

- 🔐 JWT-based authentication
- 🛒 Shopping cart (supports logged-in users and guests)
- ❤️ Wishlist functionality (supports logged-in users and guests)
- 📦 Order management with tracking
- 📝 FAQ management
- 📄 Policy pages (Privacy, Refund, Shipping, Terms)
- 📧 Contact form with email notifications
- 🔍 Product search and filtering

## Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: express-validator
- **Email**: Nodemailer (optional)

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

## Installation

1. **Clone the repository** (if not already done)
   ```bash
   cd ozme-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure:
   - `MONGO_URI` - MongoDB connection string
   - `JWT_SECRET` - Secret key for JWT tokens
   - `CLIENT_URL` - Frontend URL (default: http://localhost:5174)
   - `PORT` - Server port (default: 5000)
   - Email configuration (optional)

4. **Start MongoDB**
   - Local: Ensure MongoDB is running on `mongodb://localhost:27017`
   - Atlas: Use your MongoDB Atlas connection string

5. **Seed FAQs** (optional)
   ```bash
   node src/scripts/seedFaqs.js
   ```

## Running the Server

### Development Mode
```bash
npm run dev
```
Uses nodemon for auto-restart on file changes.

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:5000` (or your configured PORT).

### Production Deployment with PM2

When deploying with PM2, **always use `--update-env` flag** to ensure environment variables are reloaded:

```bash
# Restart backend with updated environment variables
pm2 restart ozme-backend --update-env

# Or start for the first time
pm2 start src/server.js --name ozme-backend --update-env
```

**Important:** After updating `.env` file (especially Cloudinary credentials), you **must** restart with `--update-env`:
- Cloudinary configuration is loaded on server startup
- Old credentials may be cached in PM2 process memory
- `--update-env` ensures fresh environment variables are loaded

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)
- `POST /api/auth/logout` - Logout user

### Products
- `GET /api/products` - Get all products (with filters)
- `GET /api/products/:id` - Get single product

**Query Parameters for `/api/products`:**
- `category` - Filter by category (Oriental, Floral, Woody, etc.)
- `gender` - Filter by gender (Men, Women, Unisex)
- `minPrice`, `maxPrice` - Price range
- `minRating` - Minimum rating
- `tag` - Product tag (Bestseller, New, Limited)
- `search` - Search term
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

### Cart
- `GET /api/cart` - Get user's cart (optional auth)
- `POST /api/cart` - Add item to cart (optional auth)
- `PATCH /api/cart/:itemId` - Update cart item quantity
- `DELETE /api/cart/:itemId` - Remove item from cart
- `DELETE /api/cart` - Clear entire cart

### Wishlist
- `GET /api/wishlist` - Get user's wishlist (optional auth)
- `POST /api/wishlist` - Add item to wishlist (optional auth)
- `DELETE /api/wishlist/:productId` - Remove from wishlist
- `GET /api/wishlist/check/:productId` - Check if product is in wishlist

### Orders
- `POST /api/orders` - Create order from cart (protected)
- `GET /api/orders/user` - Get user's orders (protected)
- `GET /api/orders/:id` - Get order by ID (protected)
- `GET /api/orders/track/:identifier` - Track order by ID or tracking number

### FAQs
- `GET /api/faqs` - Get all FAQs

### Policies
- `GET /api/policies/:type` - Get policy by type (privacy, refund, shipping, terms)

### Contact
- `POST /api/contact` - Submit contact form

### Health Check
- `GET /api/health` - Server health check (includes database and Cloudinary status)

## Guest Mode

The API supports guest users (non-logged-in) for cart and wishlist:
- Guest users receive a `guestToken` cookie automatically
- Cart and wishlist data persists for guests using this token
- When a guest logs in, their guest data can be merged with their account

## Authentication

Protected routes require a JWT token in:
- **Authorization header**: `Bearer <token>`
- **Cookie**: `token` cookie (set automatically on login)

## Testing

Run tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm test -- --coverage
```

## Code Quality

### Linting
```bash
npm run lint
```

### Formatting
Prettier is configured. Format code using your IDE or:
```bash
npx prettier --write "src/**/*.js"
```

## Project Structure

```
ozme-backend/
├── src/
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── controllers/           # Route controllers
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── cartController.js
│   │   ├── wishlistController.js
│   │   ├── orderController.js
│   │   ├── faqController.js
│   │   ├── policyController.js
│   │   └── contactController.js
│   ├── middleware/
│   │   ├── authMiddleware.js   # JWT authentication
│   │   ├── errorHandler.js    # Error handling
│   │   └── validateRequest.js # Request validation
│   ├── models/                # Mongoose models
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── CartItem.js
│   │   ├── WishlistItem.js
│   │   ├── Order.js
│   │   ├── Review.js
│   │   ├── Faq.js
│   │   ├── Policy.js
│   │   └── Contact.js
│   ├── routes/                # Express routes
│   │   ├── authRoutes.js
│   │   ├── productRoutes.js
│   │   ├── cartRoutes.js
│   │   ├── wishlistRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── faqRoutes.js
│   │   ├── policyRoutes.js
│   │   └── contactRoutes.js
│   ├── scripts/
│   │   └── seedFaqs.js        # FAQ seed script
│   ├── utils/
│   │   ├── generateToken.js   # JWT token generation
│   │   ├── generateGuestToken.js
│   │   └── sendEmail.js       # Email utilities
│   ├── __tests__/             # Jest tests
│   └── server.js              # Express app entry point
├── .env.example               # Environment variables template
├── .eslintrc.json            # ESLint configuration
├── .prettierrc               # Prettier configuration
├── jest.config.js            # Jest configuration
├── package.json
└── README.md
```

## Environment Variables

See `.env.example` for all available environment variables.

**Required:**
- `MONGODB_URI` - MongoDB connection string (Atlas or local)
- `JWT_SECRET` - Secret for JWT tokens
- `CLIENT_URL` - Frontend URL for CORS
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret

**Optional:**
- `PORT` - Server port (default: 5000)
- `JWT_EXPIRE` - JWT expiration (default: 30d)
- Email configuration (for contact form notifications)

## Integration with Frontend

The frontend should:
1. Set `VITE_API_BASE_URL=http://localhost:5000/api` in `.env`
2. Include JWT token in requests: `Authorization: Bearer <token>`
3. Handle guest tokens for cart/wishlist (cookies are set automatically)

## License

ISC

## Support

For issues or questions, contact support@ozme.in

