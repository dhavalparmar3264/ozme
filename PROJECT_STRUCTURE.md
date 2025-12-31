# OZME Project Structure

```
OZME/
├── Ozem-Admin/                    # Admin Dashboard (React + TypeScript)
│   ├── src/
│   ├── dist/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── ozme-backend/                  # Backend API (Node.js + Express)
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js              # MongoDB connection
│   │   ├── controllers/          # Request handlers
│   │   │   ├── adminAuthController.js
│   │   │   ├── adminCategoryController.js
│   │   │   ├── adminDashboardController.js
│   │   │   ├── adminOrderController.js
│   │   │   ├── adminProductController.js
│   │   │   ├── adminReviewController.js
│   │   │   ├── adminUserController.js
│   │   │   ├── authController.js
│   │   │   ├── cartController.js
│   │   │   ├── contactController.js
│   │   │   ├── couponController.js
│   │   │   ├── faqController.js
│   │   │   ├── newsletterController.js
│   │   │   ├── orderController.js
│   │   │   ├── paymentController.js      # Cashfree payment handling
│   │   │   ├── phoneController.js
│   │   │   ├── policyController.js
│   │   │   ├── productController.js
│   │   │   ├── reviewController.js
│   │   │   ├── testEmailController.js
│   │   │   ├── userController.js
│   │   │   └── wishlistController.js
│   │   ├── middleware/           # Custom middleware
│   │   │   ├── adminAuthMiddleware.js
│   │   │   ├── authMiddleware.js
│   │   │   ├── errorHandler.js
│   │   │   └── validateRequest.js
│   │   ├── models/               # Mongoose schemas
│   │   │   ├── CartItem.js
│   │   │   ├── Category.js
│   │   │   ├── Contact.js
│   │   │   ├── Coupon.js
│   │   │   ├── Faq.js
│   │   │   ├── NewsletterSubscriber.js
│   │   │   ├── Order.js
│   │   │   ├── OTP.js
│   │   │   ├── Policy.js
│   │   │   ├── Product.js
│   │   │   ├── Review.js
│   │   │   ├── User.js
│   │   │   └── WishlistItem.js
│   │   ├── routes/               # API routes
│   │   │   ├── adminAuthRoutes.js
│   │   │   ├── adminCategoryRoutes.js
│   │   │   ├── adminCouponRoutes.js
│   │   │   ├── adminDashboardRoutes.js
│   │   │   ├── adminOrderRoutes.js
│   │   │   ├── adminProductRoutes.js
│   │   │   ├── adminReviewRoutes.js
│   │   │   ├── adminUserRoutes.js
│   │   │   ├── authRoutes.js
│   │   │   ├── cartRoutes.js
│   │   │   ├── contactRoutes.js
│   │   │   ├── couponRoutes.js
│   │   │   ├── emailRoutes.js
│   │   │   ├── faqRoutes.js
│   │   │   ├── newsletterRoutes.js
│   │   │   ├── orderRoutes.js
│   │   │   ├── paymentRoutes.js          # Cashfree payment routes
│   │   │   ├── phoneRoutes.js
│   │   │   ├── policyRoutes.js
│   │   │   ├── productRoutes.js
│   │   │   ├── reviewRoutes.js
│   │   │   ├── userRoutes.js
│   │   │   └── wishlistRoutes.js
│   │   ├── utils/                # Utility functions
│   │   │   ├── apiClient.js
│   │   │   ├── cashfree.js       # Cashfree payment integration
│   │   │   ├── cloudinary.js
│   │   │   ├── generateGuestToken.js
│   │   │   ├── generateToken.js
│   │   │   ├── orderEmails.js
│   │   │   ├── razorpay.js
│   │   │   ├── sendEmail.js
│   │   │   └── sms.js
│   │   ├── scripts/              # Utility scripts
│   │   └── server.js             # Main server entry point
│   ├── package.json
│   └── README.md
│
└── Ozme-frontend/                # Frontend (React + Vite)
    ├── src/
    │   ├── assets/               # Static assets
    │   │   └── image/
    │   ├── componets/            # React components
    │   │   ├── Footer.jsx
    │   │   ├── Headers.jsx
    │   │   ├── Home/             # Home page components
    │   │   ├── Loading.jsx
    │   │   ├── Product.jsx
    │   │   ├── ProductModel.jsx
    │   │   ├── ProtectedRoute.jsx
    │   │   ├── ScrollToTop.jsx
    │   │   └── StateCitySelect.jsx
    │   ├── context/              # React Context providers
    │   │   ├── AuthContext.jsx
    │   │   ├── CartContext.jsx
    │   │   └── WishlistContext.jsx
    │   ├── data/                 # Static data
    │   │   └── productData.js
    │   ├── pages/                # Page components
    │   │   ├── About.jsx
    │   │   ├── Cart.jsx
    │   │   ├── Checkout.jsx      # Checkout with Cashfree integration
    │   │   ├── Contact.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── FAQ.jsx
    │   │   ├── Home.jsx
    │   │   ├── Login.jsx
    │   │   ├── Orders.jsx
    │   │   ├── Privacy.jsx
    │   │   ├── Refund.jsx
    │   │   ├── Reviews.jsx
    │   │   ├── SearchResults.jsx
    │   │   ├── Shipping.jsx
    │   │   ├── Shop.jsx
    │   │   ├── Terms.jsx
    │   │   ├── TrackOrder.jsx
    │   │   └── Wishlist.jsx
    │   ├── utils/                # Utility functions
    │   │   ├── api.js            # API request utility
    │   │   ├── filterProducts.js
    │   │   ├── generateOrderId.js
    │   │   ├── indianLocations.js
    │   │   └── toast.js
    │   ├── App.jsx               # Main App component
    │   ├── App.css
    │   ├── firebase.js           # Firebase configuration
    │   ├── index.css
    │   └── main.jsx              # React entry point
    ├── public/                   # Public static files
    ├── dist/                     # Build output
    ├── index.html                # HTML template (includes Cashfree SDK)
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── postcss.config.js
```

## Key Files for Payment Integration

### Backend:
- **`ozme-backend/src/utils/cashfree.js`** - Cashfree payment utility functions
- **`ozme-backend/src/controllers/paymentController.js`** - Payment request handlers
- **`ozme-backend/src/routes/paymentRoutes.js`** - Payment API routes

### Frontend:
- **`Ozme-frontend/src/pages/Checkout.jsx`** - Checkout page with Cashfree integration
- **`Ozme-frontend/index.html`** - Contains Cashfree JS SDK script tag
- **`Ozme-frontend/src/utils/api.js`** - API request utility

## Environment Variables Required

### Backend (.env):
```
CASHFREE_CLIENT_ID=your_client_id
CASHFREE_CLIENT_SECRET=your_client_secret
CASHFREE_ENVIRONMENT=production
CASHFREE_WEBHOOK_SECRET=your_webhook_secret
CLIENT_URL=https://ozme.in
API_BASE_URL=https://ozme.in/api
```

## Important Notes

1. **Payment Gateway**: Currently using Cashfree Hosted Checkout
2. **SDK Loading**: Cashfree JS SDK is loaded in `index.html` and initialized in `Checkout.jsx`
3. **Fallback**: If SDK fails to load, direct redirect to Cashfree checkout is used
4. **Admin Panel**: Separate React TypeScript application in `Ozem-Admin/`

