# PhonePe Pay Page Integration Fix - Complete

## Integration Type Confirmed

**Pay Page Integration (Checksum/Salt Flow)**
- Uses `X-VERIFY` header with signature: `sha256(base64Payload + endpoint + SALT_KEY) + "###" + SALT_INDEX`
- Uses `X-MERCHANT-ID` header (NOT `X-CLIENT-ID`)
- Headers: `Content-Type`, `Accept`, `X-VERIFY`, `X-MERCHANT-ID`

## Changes Made

### 1. Fixed Headers (`ozme-backend/src/utils/phonepe.js`)

**Before (INCORRECT):**
```javascript
headers: {
  'X-VERIFY': xVerify,
  'X-CLIENT-ID': config.clientId,  // ❌ Wrong for Pay Page
}
```

**After (CORRECT):**
```javascript
headers: {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'X-VERIFY': xVerify,
  'X-MERCHANT-ID': config.merchantId,  // ✅ Correct for Pay Page
}
```

### 2. Removed Fallback Redirect (`ozme-backend/src/controllers/paymentController.js`)

**Before:**
```javascript
const finalRedirectUrl = phonePeResponse.redirectUrl || redirectUrl;  // ❌ Fallback
```

**After:**
```javascript
if (!phonePeResponse.redirectUrl) {
  throw new Error('PhonePe API did not return a valid redirect URL.');
}
const finalRedirectUrl = phonePeResponse.redirectUrl;  // ✅ Authoritative
```

### 3. Added Payment Status Endpoint

**New Endpoint:** `GET /api/payments/phonepe/status/:merchantTransactionId`
- Queries PhonePe PROD API for payment status
- Updates order status idempotently (PENDING -> PAID/FAILED)
- Returns payment state, transaction ID, order status

### 4. Updated Frontend Success Page (`Ozme-frontend/src/pages/CheckoutSuccess.jsx`)

- Verifies payment status BEFORE showing success
- Uses new `/payments/phonepe/status/:merchantTransactionId` endpoint
- Falls back to `/payments/phonepe/verify/:orderId` if merchantTransactionId not available
- Shows error if payment failed

### 5. Enhanced Diagnostic Logs

Added comprehensive logging (no secrets):
- Full URL called (must be `https://api.phonepe.com/apis/hermes/pg/v1/pay`)
- Integration type (Pay Page - Checksum/Salt flow)
- Headers sent (X-VERIFY, X-MERCHANT-ID, Content-Type, Accept)
- Signature mode and format
- Redirect domain returned
- SALT_KEY configuration status
- Detailed error messages if UAT URL detected

## Required Environment Variables

```env
# Mode (must be PROD)
PHONEPE_MODE=PROD

# Base URL (PROD endpoint)
PHONEPE_BASE_URL=https://api.phonepe.com/apis/hermes

# Merchant Credentials
PHONEPE_MERCHANT_ID=M23BLFR8IV7IN

# SDK Credentials (for authentication, not signature)
PHONEPE_CLIENT_ID=SU2512241530570377413815
PHONEPE_CLIENT_SECRET=your-client-secret-here
PHONEPE_CLIENT_VERSION=1  # Optional

# Signature Credentials (REQUIRED for X-VERIFY)
PHONEPE_SALT_KEY=your-salt-key-from-phonepe-dashboard  # REQUIRED
PHONEPE_SALT_INDEX=1  # Usually "1"

# URLs
PHONEPE_RETURN_URL=https://ozme.in/checkout/success?order_id={order_id}
PHONEPE_CALLBACK_URL=https://www.ozme.in/api/payments/phonepe/callback

# Webhook Auth
PHONEPE_WEBHOOK_USERNAME=ozme_perfume
PHONEPE_WEBHOOK_PASSWORD=Ozme9Secure
```

## Signature Format

```
sha256(base64Payload + endpoint + SALT_KEY) + "###" + SALT_INDEX
```

**Example:**
```
sha256("eyJtZXJjaGFudElkIjoiTTIzQkxGUjhJVjdJTiIs..." + "/pg/v1/pay" + "your-salt-key") + "###" + "1"
```

## Headers Sent to PhonePe API

```javascript
{
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'X-VERIFY': 'sha256(...)###1',
  'X-MERCHANT-ID': 'M23BLFR8IV7IN'
}
```

## Files Changed

1. `ozme-backend/src/utils/phonepe.js`
   - Changed `X-CLIENT-ID` to `X-MERCHANT-ID` in payment creation
   - Changed `X-CLIENT-ID` to `X-MERCHANT-ID` in status check
   - Added comprehensive diagnostic logs
   - Updated integration style comments

2. `ozme-backend/src/controllers/paymentController.js`
   - Removed fallback redirect URL
   - Added `phonepeGetPaymentStatus` endpoint
   - Updated integration style comments

3. `ozme-backend/src/routes/paymentRoutes.js`
   - Added `GET /api/payments/phonepe/status/:merchantTransactionId` route

4. `Ozme-frontend/src/pages/CheckoutSuccess.jsx`
   - Added payment status verification before showing success
   - Uses new status endpoint

## Expected Behavior

After fix:
- ✅ Headers use `X-MERCHANT-ID` (not `X-CLIENT-ID`)
- ✅ Signature uses `SALT_KEY` + `SALT_INDEX` (not clientSecret/clientVersion)
- ✅ No fallback redirect URLs
- ✅ PhonePe returns PROD redirect URL: `mercury.phonepe.com` (NOT `mercury-uat.phonepe.com`)
- ✅ Payment status verified before showing success
- ✅ Comprehensive diagnostic logs for troubleshooting

## Diagnostic Logs

When payment is initiated, logs will show:

```
🔐 X-VERIFY Signature Generated:
   endpoint: /pg/v1/pay
   saltKeyLength: XX
   saltIndex: 1
   signatureFormat: sha256(base64Payload + endpoint + SALT_KEY) + "###" + SALT_INDEX

📤 PhonePe Request Details (Headers):
   url: https://api.phonepe.com/apis/hermes/pg/v1/pay
   headers: {
     'X-VERIFY': 'sha256(...)###1',
     'X-MERCHANT-ID': 'M23BLFR8IV7IN',
     'Content-Type': 'application/json',
     'Accept': 'application/json'
   }
   integrationType: 'Pay Page (Checksum/Salt flow)'

🔍 DEBUG: Redirect URL Details (Diagnostic):
   fullUrlCalled: https://api.phonepe.com/apis/hermes/pg/v1/pay
   redirectUrl: https://mercury.phonepe.com/...
   checkoutDomain: mercury.phonepe.com
   isUatDomain: false
```

If UAT URL detected:
```
❌ CRITICAL: PhonePe returned UAT/simulator URL!
   Diagnostic Information:
   - Full URL Called: https://api.phonepe.com/apis/hermes/pg/v1/pay
   - Redirect Domain: mercury-uat.phonepe.com
   - Signature Mode: Checksum/Salt flow
   - SALT_KEY Configured: true (length: XX)
   - SALT_INDEX: 1
   Possible Causes:
   1. SALT_KEY mismatch with PhonePe dashboard
   2. SALT_INDEX mismatch with PhonePe dashboard
   3. Invalid signature (credentials or signature format)
   4. Merchant account not activated for PROD
   5. Merchant ID is UAT/test merchant ID
```

## Deployment Steps

1. **Update `.env` file:**
   ```bash
   # Ensure these are set:
   PHONEPE_SALT_KEY=your-salt-key-from-phonepe-dashboard
   PHONEPE_SALT_INDEX=1
   ```

2. **Restart backend:**
   ```bash
   cd /var/www/ozme_production/OZME/ozme-backend
   pm2 restart ozme-backend --update-env
   ```

3. **Verify startup logs:**
   ```bash
   tail -f server.log | grep "PhonePe Configuration"
   ```
   Should show: `SALT_KEY: ✓ Set (length: XX)`

4. **Test payment flow:**
   - Go to checkout
   - Click "Pay Securely"
   - Check logs for diagnostic information
   - Verify redirect URL is PROD (not UAT)

## Troubleshooting

If still getting UAT URLs:

1. **Verify SALT_KEY matches PhonePe dashboard:**
   - Log in to PhonePe Merchant Dashboard
   - Go to API Credentials → PROD
   - Copy SALT_KEY exactly (no extra spaces/quotes)
   - Update `.env` file

2. **Verify SALT_INDEX matches PhonePe dashboard:**
   - Usually "1", but verify in PhonePe dashboard
   - Update `PHONEPE_SALT_INDEX` if different

3. **Check diagnostic logs:**
   - Look for `🔍 DEBUG: Redirect URL Details (Diagnostic)` log
   - Verify `hasSaltKey: true` and `saltKeyLength: XX`
   - Check `isUatDomain: false`

4. **Verify merchant account:**
   - Contact PhonePe support to activate merchant account for PROD
   - Verify merchant ID `M23BLFR8IV7IN` is PROD (not UAT)

5. **Check signature:**
   - Verify signature format matches: `sha256(...)###1`
   - Verify SALT_KEY is used (not clientSecret)
   - Verify SALT_INDEX is used (not clientVersion)

## Summary

Fixed PhonePe integration to use correct Pay Page (Checksum/Salt flow):
- ✅ Headers: `X-MERCHANT-ID` (not `X-CLIENT-ID`)
- ✅ Signature: `SALT_KEY` + `SALT_INDEX` (not clientSecret/clientVersion)
- ✅ No fallback redirect URLs
- ✅ Payment status verification endpoint added
- ✅ Comprehensive diagnostic logs

After adding `PHONEPE_SALT_KEY` to `.env` and restarting, PhonePe should return PROD redirect URLs.

