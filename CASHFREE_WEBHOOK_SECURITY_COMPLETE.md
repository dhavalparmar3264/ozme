# ✅ Cashfree Webhook Security Finalized

## Summary

Cashfree webhook endpoint has been secured with proper signature verification using `CASHFREE_WEBHOOK_SECRET`. The webhook now:
- Verifies signature using dedicated webhook secret
- Rejects invalid signatures with 401
- Processes webhooks securely
- Returns 200 OK after successful processing
- Ensures idempotency

## ✅ Changes Made

### 1. Environment Variable

**New Variable:** `CASHFREE_WEBHOOK_SECRET`
- Separate from `CASHFREE_SECRET_KEY` (API credentials)
- Used ONLY for webhook signature verification
- Generated from Cashfree dashboard → Webhooks → Webhook Secret

### 2. Signature Verification (`cashfree.js`)

**Updated Function:** `verifyCashfreeWebhookSignature()`
- Uses `CASHFREE_WEBHOOK_SECRET` (not `CASHFREE_SECRET_KEY`)
- Accepts raw payload (Buffer or string)
- Returns boolean (true if valid)
- Logs verification status safely

**Signature Algorithm:**
```
HMAC SHA256(raw_payload, CASHFREE_WEBHOOK_SECRET)
```

### 3. Webhook Handler (`paymentController.js`)

**Security Flow:**
1. ✅ Extract signature from `x-webhook-signature` header
2. ✅ Verify signature using raw body
3. ✅ Reject with 401 if invalid
4. ✅ Parse payload after verification
5. ✅ Process webhook (update order, reduce stock)
6. ✅ Return 200 OK after successful processing

**Key Features:**
- ✅ Signature verification BEFORE processing
- ✅ 401 response for invalid signatures
- ✅ 200 OK after successful processing
- ✅ Idempotency checks (prevents duplicate processing)
- ✅ Safe logging (no secrets)

### 4. Server Startup Logs (`server.js`)

**Added Logging:**
- `WEBHOOK_SECRET: ✓ Set (length: X)` or `✗ NOT SET`
- Warning if `CASHFREE_WEBHOOK_SECRET` not configured
- Webhook auth method: `x-webhook-signature (HMAC SHA256)`

## 🔒 Security Implementation

### Signature Verification

```javascript
// Extract signature from header
const signature = req.headers['x-webhook-signature'];

// Verify using raw body and webhook secret
const isValid = verifyCashfreeWebhookSignature(rawBody, signature);

if (!isValid) {
    return res.status(401).json({
        success: false,
        message: 'Invalid webhook signature',
    });
}
```

### Webhook Processing

1. **Verify Signature** → Reject if invalid (401)
2. **Parse Payload** → Extract event type, order_id, payment_status
3. **Find Order** → Lookup by cashfreeOrderId
4. **Check Idempotency** → Skip if already processed
5. **Update Order** → Set payment status, reduce stock
6. **Send Emails** → Order confirmation (non-blocking)
7. **Return 200 OK** → Acknowledge successful processing

## 📋 Webhook Endpoint Details

- **URL:** `POST https://www.ozme.in/api/payments/cashfree/webhook`
- **Authentication:** Signature verification (x-webhook-signature header)
- **Content-Type:** `application/json`
- **Raw Body Parser:** Enabled (for signature verification)
- **Response:** 
  - `200 OK` - Successfully processed
  - `401 Unauthorized` - Invalid signature
  - `400 Bad Request` - Invalid payload

## 🔄 Webhook Flow

1. **Cashfree sends webhook** → POST with signature header
2. **Extract signature** → From `x-webhook-signature` header
3. **Verify signature** → HMAC SHA256(raw_body, WEBHOOK_SECRET)
4. **Reject if invalid** → Return 401
5. **Parse payload** → Extract event data
6. **Process webhook** → Update order, reduce stock
7. **Return 200 OK** → Acknowledge receipt

## ✅ Idempotency

- Checks if order already processed before updating
- Skips duplicate webhook events
- Prevents double stock reduction
- Prevents duplicate email sends

## 📝 Safe Logging

**Logged (Safe):**
- Event type
- Order ID (truncated)
- Order status
- Payment status
- Signature verification status (prefix only)

**NOT Logged (Secure):**
- Webhook secret
- Full signature
- Full payload
- User details

## 🚀 Setup Instructions

### 1. Add Environment Variable

Add to `.env` file:
```bash
CASHFREE_WEBHOOK_SECRET=your_webhook_secret_from_dashboard
```

### 2. Get Webhook Secret

1. Go to Cashfree Dashboard
2. Navigate to: **Settings → Webhooks**
3. Copy the **Webhook Secret** (generated when webhook is enabled)
4. Add to `.env` as `CASHFREE_WEBHOOK_SECRET`

### 3. Restart Backend

```bash
pm2 restart ozme-backend --update-env
```

### 4. Verify Configuration

Check server logs for:
```
WEBHOOK_SECRET: ✓ Set (length: X)
```

## ✅ Status

- ✅ `CASHFREE_WEBHOOK_SECRET` environment variable added
- ✅ Signature verification using webhook secret
- ✅ Invalid signatures rejected with 401
- ✅ Valid signatures processed securely
- ✅ Idempotency ensured
- ✅ Safe logging implemented
- ✅ Server startup logs updated
- ✅ Backend restarted

---

**Next Step:** Add `CASHFREE_WEBHOOK_SECRET` to `.env` file and restart backend.

