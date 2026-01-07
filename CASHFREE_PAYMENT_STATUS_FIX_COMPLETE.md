# ✅ Cashfree Payment Status + Retry + Invoice Gating - Complete

## Summary

Implemented comprehensive fixes for Cashfree payment status reconciliation, retry payment functionality, and invoice download gating on the order tracking page.

## ✅ Backend Changes

### 1. Payment Status Reconciliation ✅
**File**: `ozme-backend/src/controllers/orderController.js`

- **20-Minute Timeout Logic**: 
  - If payment is `PENDING` and `(now - order.createdAt) > 20 minutes`, automatically mark as `FAILED`
  - Sets `failureReason: 'TIMEOUT_PENDING_OVER_20_MIN'`
  - **Idempotent**: Only updates if not already failed (prevents overwriting)

- **Cashfree Status Verification**:
  - Queries Cashfree API for latest payment status
  - Maps Cashfree statuses: `PAID/SUCCESS` → `Paid`, `EXPIRED/FAILED/CANCELLED` → `Failed`
  - **Idempotent**: Never reverts successful payments back to failed
  - Throttles API calls (max once per 30 seconds)

- **Enhanced Response**:
  - Returns `remainingMinutes` for pending payments
  - Returns `timeElapsedMinutes` for tracking
  - Returns `failureReason` for failed payments
  - Returns `canRetryPayment` flag

### 2. Retry Payment Endpoint ✅
**File**: `ozme-backend/src/controllers/orderController.js`
**Route**: `POST /api/orders/:orderId/retry-payment`

- **Preconditions**:
  - Only allows retry when `paymentStatus !== 'Paid'`
  - Only allows retry when `orderStatus !== 'Cancelled'`
  - Only allows retry for `paymentMethod === 'Prepaid'` (online payments)
  - User must own the order (or be admin)

- **Functionality**:
  - Creates NEW Cashfree payment session (fresh `payment_session_id`)
  - Updates order with new `cashfreeOrderId`
  - Resets `paymentStatus` to `Pending`
  - Clears `failureReason`
  - Returns `paymentSessionId` and `paymentLink`

### 3. Order Model Update ✅
**File**: `ozme-backend/src/models/Order.js`

- Added `failureReason` field to store failure reason (e.g., `TIMEOUT_PENDING_OVER_20_MIN`, `EXPIRED`, `CANCELLED`, `FAILED`)

### 4. Routes Update ✅
**File**: `ozme-backend/src/routes/orderRoutes.js`

- Added `POST /:orderId/retry-payment` route (protected, requires authentication)

## ✅ Frontend Changes

### 1. Payment Status Polling ✅
**File**: `Ozme-frontend/src/pages/TrackOrder.jsx`

- **Polling Interval**: Changed from 30 seconds to 20 seconds (within 15-30 second range)
- **Timeout Handling**: Stops polling when backend returns `remainingMinutes === null` (timed out)
- **Status Updates**: Automatically stops polling on `SUCCESS` or `FAILED`

### 2. Payment Confirmation Banner ✅
**File**: `Ozme-frontend/src/pages/TrackOrder.jsx`

- **SUCCESS State**: Green banner with "✅ Payment Successful - Order Confirmed"
- **FAILED State**: Red banner with:
  - Specific failure message based on `failureReason`
  - "Retry Payment" button (if `canRetryPayment === true`)
- **PENDING State**: Blue/amber banner with:
  - Countdown: "Checking again... (X minutes remaining)"
  - Uses backend's `remainingMinutes` if available, otherwise calculates from `paymentStartTime`
  - Shows "Refresh Status" button
  - After timeout (>20 min), shows both "Refresh Status" and "Retry Payment" buttons

### 3. Retry Payment Handler ✅
**File**: `Ozme-frontend/src/pages/TrackOrder.jsx`

- **New Endpoint**: Uses `POST /api/orders/:orderId/retry-payment` (instead of `/payments/cashfree/create`)
- **Payment Link**: Redirects to `paymentLink` if provided, otherwise uses Cashfree SDK
- **User Feedback**: Toast notifications for loading, success, and errors

### 4. Invoice Download Gating ✅
**File**: `Ozme-frontend/src/pages/TrackOrder.jsx`

- **Frontend Gating**: 
  - Only shows enabled "Download Invoice" button when `orderStatus === 'Delivered'`
  - Disabled button with tooltip "Invoice available after delivery" for non-delivered orders
  - Shows error toast if user tries to download before delivery

- **Backend Gating**: 
  - Invoice download is client-side only (jsPDF generation)
  - Frontend check prevents download before delivery
  - Note: If backend invoice endpoint is added later, it should enforce `orderStatus === 'Delivered'`

## ✅ Key Features

### Payment Status Flow

1. **Pending (< 20 minutes)**:
   - Blue banner: "Payment pending confirmation"
   - Shows countdown: "X minutes remaining"
   - Polls every 20 seconds
   - "Refresh now" link

2. **Pending (> 20 minutes)**:
   - Amber banner: "Payment confirmation taking longer"
   - Shows "Refresh Status" and "Retry Payment" buttons
   - Backend automatically marks as `FAILED` with `TIMEOUT_PENDING_OVER_20_MIN`

3. **Failed**:
   - Red banner: "❌ Payment Failed"
   - Shows specific failure reason
   - "Retry Payment" button (creates new payment session)

4. **Success**:
   - Green banner: "✅ Payment Successful - Order Confirmed"
   - Polling stops
   - Page refreshes to show updated order status

### Retry Payment Flow

1. User clicks "Retry Payment"
2. Frontend calls `POST /api/orders/:orderId/retry-payment`
3. Backend creates new Cashfree payment session
4. Backend updates order with new `cashfreeOrderId` and resets status
5. Frontend redirects to Cashfree payment page
6. User completes payment
7. Cashfree webhook updates order status

### Invoice Download Flow

1. User clicks "Download Invoice"
2. Frontend checks: `orderStatus === 'Delivered'`
3. If not delivered: Shows error toast
4. If delivered: Generates PDF invoice using jsPDF

## ✅ Testing Checklist

### Payment Status Reconciliation
- [x] Pending payment < 20 min: Shows countdown, polls every 20 seconds
- [x] Pending payment > 20 min: Backend marks as FAILED, shows retry button
- [x] Cashfree returns SUCCESS: Order marked as Paid, polling stops
- [x] Cashfree returns FAILED: Order marked as Failed, shows retry button
- [x] Idempotent: Successful payments never revert to failed

### Retry Payment
- [x] Failed payment: Shows "Retry Payment" button
- [x] Click retry: Creates new payment session, redirects to Cashfree
- [x] Preconditions: Only works for non-paid, non-cancelled, online payments
- [x] User ownership: Only order owner (or admin) can retry

### Invoice Download
- [x] Delivered order: "Download Invoice" button enabled
- [x] Non-delivered order: "Download Invoice" button disabled with tooltip
- [x] Click before delivery: Shows error toast

## ✅ Files Modified

### Backend
1. ✅ `ozme-backend/src/models/Order.js` - Added `failureReason` field
2. ✅ `ozme-backend/src/controllers/orderController.js` - Payment status reconciliation + retry endpoint
3. ✅ `ozme-backend/src/routes/orderRoutes.js` - Added retry payment route

### Frontend
1. ✅ `Ozme-frontend/src/pages/TrackOrder.jsx` - Payment polling, banner, retry handler, invoice gating

## ✅ Example Order Flow

For order `695aad4d34b4a1fc0b9098e3`:

1. **Initial State**: Payment PENDING, shows blue banner with countdown
2. **After 20 minutes**: Backend marks as FAILED (`TIMEOUT_PENDING_OVER_20_MIN`), shows red banner with "Retry Payment"
3. **User clicks Retry**: New payment session created, redirects to Cashfree
4. **After payment**: Order marked as Paid, shows green banner
5. **After delivery**: Invoice download button enabled

---

**Status:** ✅ Complete - Cashfree payment status reconciliation, retry payment, and invoice gating fully implemented

**Key Improvements:**
1. ✅ Automatic timeout handling (20 minutes)
2. ✅ Idempotent payment status updates
3. ✅ Clear user feedback with countdown and failure reasons
4. ✅ Seamless retry payment flow
5. ✅ Invoice download restricted to delivered orders only

