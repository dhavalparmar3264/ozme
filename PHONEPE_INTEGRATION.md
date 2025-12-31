# PhonePe Payment Gateway Integration

## ✅ Implementation Complete

PhonePe payment gateway has been successfully integrated to replace Cashfree. The implementation includes:

### Backend Changes

1. **New Utility File**: `ozme-backend/src/utils/phonepe.js`
   - `createPhonePePayment()` - Creates payment and returns redirect URL
   - `verifyPhonePeCallback()` - Verifies callback/webhook signature
   - `getPhonePeStatus()` - Fetches payment status from PhonePe API

2. **Updated Payment Controller**: `ozme-backend/src/controllers/paymentController.js`
   - `initiatePhonePePayment()` - Creates payment session and returns redirect URL
   - `phonepeCallback()` - Handles PhonePe webhook/callback
   - `phonepeVerifyPayment()` - Verifies payment status (for frontend success page)

3. **Updated Routes**: `ozme-backend/src/routes/paymentRoutes.js`
   - `POST /api/payments/phonepe/create` - Create payment (protected)
   - `POST /api/payments/phonepe/callback` - Webhook endpoint (public)
   - `GET /api/payments/phonepe/verify/:orderId` - Verify payment (protected)

4. **Updated Order Model**: `ozme-backend/src/models/Order.js`
   - Added `paymentGateway` field (enum: RAZORPAY, CASHFREE, PHONEPE)
   - Added `merchantTransactionId` field (PhonePe transaction ID)
   - Added `paidAt` field (payment completion timestamp)

### Frontend Changes

1. **Updated Checkout Page**: `Ozme-frontend/src/pages/Checkout.jsx`
   - Removed Cashfree SDK loading logic
   - Replaced with PhonePe payment creation and direct redirect
   - Updated UI text from "Cashfree" to "PhonePe"

2. **Updated HTML**: `Ozme-frontend/index.html`
   - Removed Cashfree SDK script tag
   - PhonePe uses direct redirect (no SDK required)

## 🔧 Environment Variables Required

Add these to your `ozme-backend/.env` file:

```env
# PhonePe Configuration
PHONEPE_CLIENT_ID=your_merchant_id
PHONEPE_CLIENT_SECRET=your_merchant_secret
PHONEPE_ENV=PROD  # or UAT for testing
PHONEPE_SALT_INDEX=1  # Optional, defaults to 1
PHONEPE_RETURN_URL=https://ozme.in/order-success?order_id={order_id}
PHONEPE_CALLBACK_URL=https://ozme.in/api/payments/phonepe/callback
```

### Environment Details

- **PHONEPE_ENV**: 
  - `PROD` → Production API: `https://api.phonepe.com/apis/hermes`
  - `UAT` → Sandbox API: `https://api-preprod.phonepe.com/apis/pg-sandbox`

- **PHONEPE_RETURN_URL**: Where users are redirected after payment
  - Use `{order_id}` placeholder if you want PhonePe to replace it
  - Example: `https://ozme.in/order-success?order_id={order_id}`

- **PHONEPE_CALLBACK_URL**: Webhook endpoint for payment status updates
  - Must be publicly accessible
  - Example: `https://ozme.in/api/payments/phonepe/callback`

## 📋 Payment Flow

### 1. Payment Initiation
1. User clicks "Pay Securely" on checkout
2. Frontend creates order via `/api/orders`
3. Frontend calls `/api/payments/phonepe/create` with order details
4. Backend:
   - Generates unique `merchantTransactionId`
   - Creates payment via PhonePe API
   - Saves payment details to order
   - Returns redirect URL
5. Frontend redirects user to PhonePe payment page

### 2. Payment Processing
- User completes payment on PhonePe hosted page
- PhonePe processes payment

### 3. Payment Callback
- PhonePe sends callback to `/api/payments/phonepe/callback`
- Backend:
   - Verifies signature
   - Updates order status (Paid/Failed)
   - Reduces product stock
   - Sends confirmation emails

### 4. User Redirect
- User is redirected to `PHONEPE_RETURN_URL`
- Frontend can verify payment via `/api/payments/phonepe/verify/:orderId`

## 🔐 Security Features

1. **Signature Verification**: All callbacks are verified using X-VERIFY header
2. **Amount Validation**: Payment amount is validated against order amount
3. **Idempotency**: Duplicate callbacks are handled (order already processed check)
4. **Trusted Source**: Payment amount is read from database, not request body

## 🧪 Testing

### Test in UAT Environment
1. Set `PHONEPE_ENV=UAT` in `.env`
2. Use UAT credentials from PhonePe dashboard
3. Test payment flow end-to-end

### Production Deployment
1. Set `PHONEPE_ENV=PROD` in `.env`
2. Use production credentials
3. Ensure callback URL is publicly accessible
4. Whitelist callback URL in PhonePe dashboard

## 📝 API Endpoints

### Create Payment
```
POST /api/payments/phonepe/create
Headers: Authorization: Bearer <token>
Body: {
  orderId: string,
  amount: number,
  customerDetails: {
    name: string,
    email: string,
    phone: string
  }
}
Response: {
  success: true,
  data: {
    redirectUrl: string,
    merchantTransactionId: string,
    orderId: string,
    amount: number
  }
}
```

### Payment Callback (Webhook)
```
POST /api/payments/phonepe/callback
Headers: X-VERIFY: <signature>
Body: <PhonePe callback payload>
Response: {
  success: true,
  message: "Callback processed successfully"
}
```

### Verify Payment
```
GET /api/payments/phonepe/verify/:orderId
Headers: Authorization: Bearer <token>
Response: {
  success: true,
  data: {
    orderId: string,
    paymentStatus: "Paid" | "Pending" | "Failed",
    orderStatus: string,
    phonePeStatus: "SUCCESS" | "FAILED" | "PENDING",
    transactionId: string
  }
}
```

## ⚠️ Important Notes

1. **Cashfree Routes Preserved**: Old Cashfree routes are kept for backward compatibility but PhonePe is now the default
2. **Order Model Updated**: New fields added for PhonePe support
3. **No SDK Required**: PhonePe uses direct redirect, no JavaScript SDK needed
4. **Callback URL**: Must be publicly accessible and whitelisted in PhonePe dashboard
5. **Signature Verification**: Uses SHA256 with salt index for security

## 🚀 Next Steps

1. Add PhonePe credentials to `.env` file
2. Test in UAT environment first
3. Configure callback URL in PhonePe dashboard
4. Test payment flow end-to-end
5. Deploy to production with PROD credentials

## 📞 Support

If you encounter issues:
1. Check backend logs for detailed error messages
2. Verify environment variables are set correctly
3. Ensure callback URL is publicly accessible
4. Verify PhonePe credentials are correct
5. Check PhonePe dashboard for transaction status

