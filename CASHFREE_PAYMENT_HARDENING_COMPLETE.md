# ✅ Cashfree Payment Tracking + Retry + Invoice Hardening - Complete

## Summary

Hardened the Cashfree payment tracking, retry payment, and invoice download logic to fix critical issues with timeout calculation, polling alignment, attempt tracking, and security.

## ✅ Critical Fixes Implemented

### 1. Payment Timeout Calculation ✅
**Problem**: Using `order.createdAt` for timeout caused old orders or delayed retries to auto-fail incorrectly.

**Fix**:
- Added `paymentInitiatedAt` and `lastPaymentAttemptAt` fields to Order model
- Timeout calculation now uses `lastPaymentAttemptAt` (or `paymentInitiatedAt` as fallback)
- Each retry updates `lastPaymentAttemptAt`, resetting the 20-minute timer
- Old orders won't incorrectly timeout based on creation date

### 2. Polling Alignment ✅
**Problem**: Backend throttled Cashfree checks to 30s, but frontend polled every 20s, causing stale UI.

**Fix**:
- Backend returns `nextCheckAt` timestamp (30s after last verification)
- Frontend uses `nextCheckAt` to schedule next poll, then continues with 30s interval
- Both backend and frontend now aligned to 30-second intervals
- No more stale UI from premature polling

### 3. Payment Attempt Tracking ✅
**Problem**: No tracking of payment attempts, old webhooks could mark order paid, no prevention of rapid retries.

**Fix**:
- Added `paymentAttempts[]` array to Order model with:
  - `attemptId`: Unique ID per attempt
  - `cashfreeOrderId`: Cashfree order ID for this attempt
  - `paymentSessionId`: Session ID for this attempt
  - `initiatedAt`: When attempt started
  - `status`: PENDING, SUCCESS, FAILED, CANCELLED, EXPIRED
  - `completedAt`: When attempt completed
- Each retry creates a new attempt record
- Old pending attempts are marked as CANCELLED when new attempt starts
- Webhook validates `attemptId` and ignores stale/cancelled attempts

### 4. Webhook Attempt Validation ✅
**Problem**: Old webhooks from cancelled attempts could mark order as paid.

**Fix**:
- Webhook finds order by `cashfreeOrderId` in `paymentAttempts[]` array
- Validates that webhook is for current/latest attempt
- Ignores webhooks for CANCELLED, FAILED, or stale attempts
- Only updates order if webhook matches latest pending attempt
- Prevents old payment confirmations from updating order

### 5. Retry Payment Rate Limiting ✅
**Problem**: Users could spam retry payment endpoint.

**Fix**:
- Added `paymentRetryRateLimiter` middleware (3 attempts per minute per IP)
- Added 10-second cooldown check in retry endpoint (prevents rapid retries)
- Returns `429 Too Many Requests` with `retryAfter` when limit exceeded

### 6. Server-Side Invoice Gating ✅
**Problem**: Invoice download was only client-side gated (users could bypass by editing JS).

**Fix**:
- Created `GET /api/orders/:orderId/invoice` endpoint
- Server-side validation: Returns `403 Forbidden` unless `orderStatus === 'Delivered'`
- Frontend calls backend endpoint before generating PDF
- Users cannot bypass by editing client-side code

## ✅ Implementation Details

### Order Model Updates
**File**: `ozme-backend/src/models/Order.js`

```javascript
paymentInitiatedAt: Date, // When payment was first initiated
lastPaymentAttemptAt: Date, // When last payment attempt was initiated
paymentAttempts: [{
  attemptId: String, // Unique attempt ID
  cashfreeOrderId: String, // Cashfree order ID
  paymentSessionId: String, // Payment session ID
  initiatedAt: Date, // When attempt started
  status: String, // PENDING, SUCCESS, FAILED, CANCELLED, EXPIRED
  completedAt: Date, // When attempt completed
}]
```

### Payment Status Endpoint Updates
**File**: `ozme-backend/src/controllers/orderController.js`

- Uses `lastPaymentAttemptAt` (or `paymentInitiatedAt`) for timeout calculation
- Returns `nextCheckAt` timestamp for frontend polling alignment
- Returns `lastPaymentAttemptAt` for attempt-based countdown

### Retry Payment Endpoint Updates
**File**: `ozme-backend/src/controllers/orderController.js`

- Creates new `paymentAttempt` record with unique `attemptId`
- Marks old pending attempts as `CANCELLED`
- Updates `lastPaymentAttemptAt` (resets 20-minute timer)
- Rate limited: 3 attempts per minute per IP
- 10-second cooldown between retries

### Webhook Updates
**File**: `ozme-backend/src/controllers/paymentController.js`

- Finds order by `cashfreeOrderId` in `paymentAttempts[]` array
- Validates webhook is for current/latest attempt
- Ignores webhooks for cancelled/failed/stale attempts
- Updates attempt status and order status only if valid

### Payment Creation Updates
**File**: `ozme-backend/src/controllers/paymentController.js`

- Creates `paymentAttempt` record on initial payment creation
- Sets `paymentInitiatedAt` and `lastPaymentAttemptAt`
- Includes `attemptId` in `cashfreeOrderId` format: `OZME_{orderId}_{attemptId}`

### Frontend Polling Updates
**File**: `Ozme-frontend/src/pages/TrackOrder.jsx`

- Uses `nextCheckAt` from backend to schedule first poll
- Continues with 30-second interval after first poll
- Aligned with backend 30-second throttle
- Shows attempt-based countdown using `lastPaymentAttemptAt`

### Invoice Download Updates
**File**: `Ozme-frontend/src/pages/TrackOrder.jsx`

- Calls `GET /api/orders/:orderId/invoice` before generating PDF
- Backend validates order is delivered (403 if not)
- Frontend shows error if backend rejects
- Server-side gating prevents bypass

## ✅ Key Improvements

### Timeout Accuracy
- ✅ Timeout based on last payment attempt, not order creation
- ✅ Retries reset the 20-minute timer
- ✅ Old orders don't incorrectly timeout

### Polling Efficiency
- ✅ Backend and frontend aligned to 30-second intervals
- ✅ No stale UI from premature polling
- ✅ Backend returns `nextCheckAt` for optimal scheduling

### Attempt Tracking
- ✅ Complete history of payment attempts
- ✅ Old attempts cannot update order status
- ✅ Webhook validates attempt validity

### Security
- ✅ Server-side invoice gating (cannot bypass)
- ✅ Rate limiting on retry endpoint
- ✅ Cooldown prevents rapid retries

## ✅ Files Modified

### Backend
1. ✅ `ozme-backend/src/models/Order.js` - Added payment attempt tracking fields
2. ✅ `ozme-backend/src/controllers/orderController.js` - Timeout fix, retry updates, invoice endpoint
3. ✅ `ozme-backend/src/controllers/paymentController.js` - Attempt tracking, webhook validation
4. ✅ `ozme-backend/src/middleware/paymentRateLimiter.js` - Rate limiting for retry endpoint
5. ✅ `ozme-backend/src/routes/orderRoutes.js` - Added invoice route, rate limiter

### Frontend
1. ✅ `Ozme-frontend/src/pages/TrackOrder.jsx` - Polling alignment, invoice gating

## ✅ Testing Checklist

### Timeout Calculation
- [x] Old order doesn't timeout based on creation date
- [x] Retry resets 20-minute timer
- [x] Timeout based on last payment attempt

### Polling Alignment
- [x] Frontend uses `nextCheckAt` from backend
- [x] Both backend and frontend use 30-second intervals
- [x] No stale UI from premature polling

### Attempt Tracking
- [x] Each retry creates new attempt record
- [x] Old attempts marked as CANCELLED
- [x] Webhook validates attempt validity

### Webhook Security
- [x] Old webhooks ignored (cancelled attempts)
- [x] Stale webhooks don't update order
- [x] Only latest attempt can mark order paid

### Rate Limiting
- [x] Retry endpoint rate limited (3/min)
- [x] 10-second cooldown between retries
- [x] Returns 429 with retryAfter

### Invoice Gating
- [x] Server returns 403 for non-delivered orders
- [x] Frontend calls backend before generating PDF
- [x] Cannot bypass by editing client-side code

---

**Status:** ✅ Complete - All hardening fixes implemented and tested

**Key Improvements:**
1. ✅ Accurate timeout calculation based on payment attempts
2. ✅ Aligned polling intervals (30s backend/frontend)
3. ✅ Complete payment attempt tracking
4. ✅ Webhook validation prevents stale updates
5. ✅ Rate limiting prevents spam retries
6. ✅ Server-side invoice gating prevents bypass

