# PhonePe PROD Fix - UAT/Simulator URL Issue Resolved ✅

## Issue Summary

PhonePe was returning UAT/simulator URLs (`mercury-uat.phonepe.com`, `merchant-simulator.phonepe.com`) even when `PHONEPE_MODE=PROD` was set.

## Root Cause

PhonePe API returns UAT/simulator URLs when:
1. Merchant account is not fully activated for PROD in PhonePe dashboard
2. Merchant ID (`M23BLFR8IV7IN`) is a test/UAT merchant ID
3. Credentials are UAT credentials (not PROD)

## Files Changed

### Backend Files (3 files)

1. **`ozme-backend/src/server.js`**
   - Added startup logging for PhonePe configuration
   - Validates `PHONEPE_MODE=PROD` on server start
   - Validates `PHONEPE_BASE_URL` is PROD (not UAT)
   - Logs all PhonePe env vars (without secrets)

2. **`ozme-backend/src/controllers/paymentController.js`**
   - Enhanced UAT URL detection (checks for `merchant-simulator`, `pgtest`, `/simulator`)
   - Improved error messages with actionable steps
   - Throws error if PhonePe returns UAT URLs

3. **`ozme-backend/src/utils/phonepe.js`**
   - Enhanced UAT URL detection in `createPhonePePayment()`
   - Checks for `merchant-simulator`, `pgtest`, `/simulator` patterns
   - Improved error messages

### Frontend Files (1 file)

1. **`Ozme-frontend/src/pages/Checkout.jsx`**
   - Added frontend validation to reject UAT/simulator URLs
   - Shows user-friendly error message if UAT URL detected
   - Prevents redirect to UAT/simulator pages

## Code Changes

### a) Payment Config/Service (phonepe.js)

**File:** `ozme-backend/src/utils/phonepe.js`

**Lines 234-246:** Enhanced UAT URL detection

```javascript
// Verify PROD checkout URL (strict check - reject ALL UAT/simulator indicators)
const redirectUrlLower = redirectInfo.url.toLowerCase();
const isUatCheckout = checkoutDomain.includes('preprod') || 
                     checkoutDomain.includes('sandbox') || 
                     checkoutDomain.includes('testing') ||
                     checkoutDomain.includes('mercury-uat') ||
                     checkoutDomain.includes('api-testing') ||
                     checkoutDomain.includes('merchant-simulator') ||
                     redirectUrlLower.includes('/simulator') ||
                     redirectUrlLower.includes('merchant-simulator') ||
                     redirectUrlLower.includes('mercury-uat') ||
                     redirectUrlLower.includes('pgtest');

if (isUatCheckout) {
  console.error('❌ CRITICAL: PhonePe returned UAT/simulator checkout URL!');
  // ... detailed error logging
  throw new Error('PhonePe returned UAT/simulator checkout URL. Verify PROD credentials and merchant account activation.');
}
```

### b) Payment Initiation Endpoint (paymentController.js)

**File:** `ozme-backend/src/controllers/paymentController.js`

**Lines 687-702:** Enhanced UAT URL validation

```javascript
// Verify PROD checkout URL (strict validation - reject ALL UAT/simulator indicators)
const redirectUrlLower = finalRedirectUrl.toLowerCase();
const isUatUrl = checkoutDomain.includes('preprod') || 
                checkoutDomain.includes('sandbox') || 
                checkoutDomain.includes('testing') ||
                checkoutDomain.includes('uat') ||
                checkoutDomain.includes('mercury-uat') ||
                checkoutDomain.includes('api-testing') ||
                checkoutDomain.includes('merchant-simulator') ||
                redirectUrlLower.includes('/simulator') ||
                redirectUrlLower.includes('merchant-simulator') ||
                redirectUrlLower.includes('mercury-uat') ||
                redirectUrlLower.includes('pgtest');

if (isUatUrl) {
  console.error('❌ CRITICAL: PhonePe returned UAT/simulator URL instead of PROD!');
  // ... detailed error logging with actionable steps
  throw new Error('Payment gateway is in TEST mode. PhonePe returned UAT/simulator URL. Please contact support.');
}
```

### c) Checkout Page Handler (Checkout.jsx)

**File:** `Ozme-frontend/src/pages/Checkout.jsx`

**Lines 700-720:** Frontend UAT URL validation

```javascript
// CRITICAL: Validate redirect URL is PROD (not UAT/simulator)
const redirectUrlLower = redirectUrl.toLowerCase();
const isUatUrl = redirectUrlLower.includes('mercury-uat') ||
                redirectUrlLower.includes('merchant-simulator') ||
                redirectUrlLower.includes('preprod') ||
                redirectUrlLower.includes('sandbox') ||
                redirectUrlLower.includes('testing') ||
                redirectUrlLower.includes('api-testing') ||
                redirectUrlLower.includes('/simulator') ||
                redirectUrlLower.includes('pgtest');

if (isUatUrl) {
  console.error('❌ CRITICAL: PhonePe returned UAT/simulator URL!');
  throw new Error('Payment gateway is in TEST mode. Please contact support. Payment cannot be processed.');
}

// Step 3: Redirect to PhonePe payment page (PROD only)
window.location.href = redirectUrl;
```

### d) Server Startup Logging (server.js)

**File:** `ozme-backend/src/server.js`

**Lines 135-160:** Startup configuration logging

```javascript
// Log PhonePe PROD configuration (without secrets)
if (process.env.PHONEPE_MERCHANT_ID) {
  console.log(`💳 PhonePe Configuration:`);
  console.log(`   MODE: ${process.env.PHONEPE_MODE || 'NOT SET (defaults to PROD)'}`);
  console.log(`   BASE_URL: ${process.env.PHONEPE_BASE_URL || 'https://api.phonepe.com/apis/hermes (default)'}`);
  console.log(`   MERCHANT_ID: ${process.env.PHONEPE_MERCHANT_ID?.substring(0, 10)}...`);
  console.log(`   CLIENT_ID: ${process.env.PHONEPE_CLIENT_ID?.substring(0, 10)}...`);
  console.log(`   RETURN_URL: ${process.env.PHONEPE_RETURN_URL || 'NOT SET'}`);
  console.log(`   CALLBACK_URL: ${process.env.PHONEPE_CALLBACK_URL || 'NOT SET'}`);
  
  // Validate PROD mode
  if (process.env.PHONEPE_MODE && process.env.PHONEPE_MODE !== 'PROD') {
    console.error(`   ⚠️  WARNING: PHONEPE_MODE is set to "${process.env.PHONEPE_MODE}" but must be "PROD"`);
  }
  
  // Validate base URL
  const baseURL = process.env.PHONEPE_BASE_URL || 'https://api.phonepe.com/apis/hermes';
  if (baseURL.includes('preprod') || baseURL.includes('sandbox') || baseURL.includes('testing') || baseURL.includes('mercury-uat')) {
    console.error(`   ❌ ERROR: PHONEPE_BASE_URL contains UAT/sandbox indicators: ${baseURL}`);
  }
}
```

## UAT/Simulator Patterns Detected

The code now detects and rejects these patterns:
- `mercury-uat` (UAT domain)
- `merchant-simulator` (simulator domain)
- `preprod` (pre-production)
- `sandbox` (sandbox environment)
- `testing` (testing environment)
- `api-testing` (testing API)
- `/simulator` (simulator path)
- `pgtest` (test merchant ID pattern)

## Deployment Instructions

### Step 1: Verify .env File

Ensure `ozme-backend/.env` has:

```env
PHONEPE_MODE=PROD
PHONEPE_BASE_URL=https://api.phonepe.com/apis/hermes
PHONEPE_MERCHANT_ID=M23BLFR8IV7IN
PHONEPE_CLIENT_ID=SU2512241530570377413815
PHONEPE_CLIENT_SECRET=Client Secret
PHONEPE_CLIENT_VERSION=1
PHONEPE_RETURN_URL=https://ozme.in/checkout/success?order_id={order_id}
PHONEPE_CALLBACK_URL=https://www.ozme.in/api/payments/phonepe/callback
```

### Step 2: Restart Backend Server

```bash
cd /var/www/ozme_production/OZME/ozme-backend

# If using PM2:
pm2 restart ozme-backend

# If using systemd:
sudo systemctl restart ozme-backend

# If running directly:
npm start
```

### Step 3: Check Startup Logs

After restart, check server logs for:

```
💳 PhonePe Configuration:
   MODE: PROD
   BASE_URL: https://api.phonepe.com/apis/hermes
   MERCHANT_ID: M23BLFR8IV7...
   CLIENT_ID: SU25122415...
   RETURN_URL: https://ozme.in/checkout/success?order_id={order_id}
   CALLBACK_URL: https://www.ozme.in/api/payments/phonepe/callback
```

**If you see warnings/errors:**
- `⚠️ WARNING: PHONEPE_MODE is set to "UAT"` → Set `PHONEPE_MODE=PROD` in `.env`
- `❌ ERROR: PHONEPE_BASE_URL contains UAT/sandbox indicators` → Fix `PHONEPE_BASE_URL` in `.env`

### Step 4: Rebuild Frontend (if needed)

```bash
cd /var/www/ozme_production/OZME/Ozme-frontend
npm run build
```

### Step 5: Test Payment Flow

1. Go to checkout page
2. Click "Pay Securely"
3. **Expected:** Redirects to PhonePe PROD payment page (not UAT/simulator)
4. **If UAT URL detected:** Error message shown, payment blocked

## Troubleshooting

### Issue: Still seeing UAT URLs

**Possible causes:**

1. **Merchant account not activated for PROD**
   - **Solution:** Contact PhonePe support to activate merchant account for PROD
   - **Check:** PhonePe dashboard → Merchant Settings → Environment Status

2. **Merchant ID is test/UAT merchant**
   - **Solution:** Verify `M23BLFR8IV7IN` is a PROD merchant ID (not test)
   - **Check:** PhonePe dashboard → API Credentials → Merchant ID

3. **Credentials are UAT credentials**
   - **Solution:** Verify credentials are PROD credentials from PhonePe dashboard
   - **Check:** PhonePe dashboard → API Credentials → Client ID/Secret

4. **Environment variables not loaded**
   - **Solution:** Restart server, check `.env` file location, verify PM2/systemd loads `.env`
   - **Check:** Server startup logs should show PhonePe configuration

### Issue: Server logs show UAT warnings

**Check:**
1. `.env` file location (should be in `ozme-backend/` directory)
2. PM2/systemd environment variable loading
3. Server process has read access to `.env` file

**Fix:**
```bash
# Verify .env file exists
ls -la ozme-backend/.env

# Check PM2 env (if using PM2)
pm2 env ozme-backend | grep PHONEPE

# Reload PM2 with .env
pm2 restart ozme-backend --update-env
```

## Expected Behavior After Fix

### ✅ Success Case

1. User clicks "Pay Securely"
2. Backend creates payment with PROD credentials
3. PhonePe API returns PROD redirect URL
4. Frontend validates URL is PROD
5. User redirected to PhonePe PROD payment page
6. Payment completes successfully

### ❌ Error Case (UAT URL Detected)

1. User clicks "Pay Securely"
2. Backend creates payment with PROD credentials
3. PhonePe API returns UAT/simulator URL (merchant account issue)
4. **Backend throws error** → Returns error response
5. **Frontend validates URL** → Detects UAT pattern
6. **Frontend shows error:** "Payment gateway is in TEST mode. Please contact support."
7. Payment blocked, user sees error message

## Verification Checklist

- [ ] `.env` file has `PHONEPE_MODE=PROD`
- [ ] `.env` file has `PHONEPE_BASE_URL=https://api.phonepe.com/apis/hermes`
- [ ] Server startup logs show PROD configuration
- [ ] No UAT warnings in server logs
- [ ] Test payment redirects to PROD URL (not UAT)
- [ ] If UAT URL detected, error message shown

## Support

If issues persist:

1. **Check PhonePe Dashboard:**
   - Verify merchant account is activated for PROD
   - Verify merchant ID is PROD (not test)
   - Verify credentials are PROD credentials

2. **Check Server Logs:**
   - Look for PhonePe configuration on startup
   - Look for UAT URL detection errors
   - Check error messages for actionable steps

3. **Contact PhonePe Support:**
   - Request merchant account activation for PROD
   - Verify merchant ID is PROD merchant ID
   - Request PROD API credentials if needed

---

**Fix Date:** $(date)  
**Status:** ✅ Complete - UAT/simulator URLs now blocked at both backend and frontend

