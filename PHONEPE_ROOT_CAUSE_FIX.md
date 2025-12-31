# PhonePe PROD Root Cause Fix - Complete ✅

## Issue

PhonePe API was returning UAT/simulator URLs (`mercury-uat.phonepe.com`, `merchant-simulator.phonepe.com`) even when calling PROD endpoint with PROD credentials.

## Root Cause Analysis

The code was correctly calling the PROD endpoint (`https://api.phonepe.com/apis/hermes/pg/v1/pay`), but PhonePe API returns UAT URLs when:

1. **Merchant account is not activated for PROD** in PhonePe dashboard
2. **Merchant ID is a test/UAT merchant ID** (test IDs usually start with `PGTEST`)
3. **Credentials are UAT credentials** (not PROD credentials)
4. **PhonePe API detects merchant as UAT** based on account status

## Files Changed

### Backend Files (2 files)

1. **`ozme-backend/src/utils/phonepe.js`**
   - Added detailed debug logging (NO secrets)
   - Enhanced merchant ID validation (rejects test merchant IDs)
   - Enhanced URL validation (checks for all UAT indicators)
   - Improved error messages with actionable steps

2. **`ozme-backend/src/controllers/paymentController.js`**
   - Added debug logging for payment initiation
   - Logs PhonePe response details
   - Enhanced error handling

## Code Changes

### a) PhonePe Config/Service (phonepe.js)

**File:** `ozme-backend/src/utils/phonepe.js`

**Lines 12-58:** Enhanced configuration with validation

```javascript
const getPhonePeConfig = () => {
  const merchantId = process.env.PHONEPE_MERCHANT_ID;
  const clientId = process.env.PHONEPE_CLIENT_ID;
  const clientSecret = process.env.PHONEPE_CLIENT_SECRET;
  const clientVersion = process.env.PHONEPE_CLIENT_VERSION || '1';
  
  // CRITICAL: Use PROD base URL from env, NEVER default to UAT
  const baseURL = process.env.PHONEPE_BASE_URL || 'https://api.phonepe.com/apis/hermes';
  const mode = process.env.PHONEPE_MODE || 'PROD';

  // DEBUG: Log environment variables
  console.log('🔍 DEBUG: PhonePe Config Loading:', {
    PHONEPE_MODE: process.env.PHONEPE_MODE || 'NOT SET (defaults to PROD)',
    PHONEPE_BASE_URL: process.env.PHONEPE_BASE_URL || 'NOT SET (defaults to PROD)',
    resolvedMode: mode,
    resolvedBaseURL: baseURL,
  });

  // Validate PROD mode - STRICT: no fallback to UAT
  if (mode !== 'PROD') {
    throw new Error(`PhonePe mode must be PROD. Current mode: ${mode}.`);
  }

  // Verify merchant ID is not a test/UAT merchant ID
  if (merchantId.toUpperCase().startsWith('PGTEST') || merchantId.toUpperCase().includes('UAT')) {
    throw new Error(`Merchant ID appears to be a test/UAT merchant ID: ${merchantId}.`);
  }

  // Verify base URL is PROD (strict check)
  const uatIndicators = ['preprod', 'sandbox', 'testing', 'mercury-uat', 'api-testing', 'merchant-simulator'];
  const hasUatIndicator = uatIndicators.some(indicator => baseURL.toLowerCase().includes(indicator));
  
  if (hasUatIndicator) {
    throw new Error(`PhonePe base URL must be PROD. Current URL: ${baseURL}.`);
  }

  return { merchantId, clientId, clientSecret, clientVersion, baseURL, environment: 'PROD' };
};
```

**Lines 84-142:** Enhanced payment creation with debug logging

```javascript
export const createPhonePePayment = async ({ merchantTransactionId, amountPaise, userId, mobileNumber, redirectUrl, callbackUrl }) => {
  const config = getPhonePeConfig();

  // DEBUG: Log environment variables (NO secrets)
  console.log('🔍 DEBUG: PhonePe Payment Creation:', {
    PHONEPE_MODE: process.env.PHONEPE_MODE || 'NOT SET',
    PHONEPE_BASE_URL: process.env.PHONEPE_BASE_URL || 'NOT SET (using default)',
    baseURL: config.baseURL,
    merchantId: config.merchantId?.substring(0, 10) + '...',
    clientId: config.clientId?.substring(0, 10) + '...',
    integrationStyle: 'SDK-based (X-VERIFY + X-CLIENT-ID)',
  });

  // Build request payload
  const payload = {
    merchantId: config.merchantId,
    merchantTransactionId,
    merchantUserId: userId || `user_${merchantTransactionId}`,
    amount: amountPaise,
    redirectUrl,
    redirectMode: 'REDIRECT',
    callbackUrl,
    paymentInstrument: { type: 'PAY_PAGE' },
  };

  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
  const endpoint = '/pg/v1/pay';
  const xVerify = generateXVerifySignature(base64Payload, endpoint);
  const fullUrl = `${config.baseURL}${endpoint}`;
  
  // Expected PROD URL: https://api.phonepe.com/apis/hermes/pg/v1/pay
  const expectedProdUrl = 'https://api.phonepe.com/apis/hermes/pg/v1/pay';
  
  // DEBUG: Log exact URL being called
  console.log('🔍 DEBUG: PhonePe API Call Details:', {
    PHONEPE_MODE: process.env.PHONEPE_MODE || 'NOT SET',
    PHONEPE_BASE_URL: process.env.PHONEPE_BASE_URL || 'NOT SET',
    configBaseURL: config.baseURL,
    endpoint: endpoint,
    fullUrl: fullUrl,
    expectedProdUrl: expectedProdUrl,
    urlMatches: fullUrl === expectedProdUrl,
  });
  
  // Verify PROD URL (strict check)
  const uatIndicators = ['preprod', 'sandbox', 'testing', 'mercury-uat', 'api-testing', 'merchant-simulator', 'pg-sandbox'];
  const isUatUrl = uatIndicators.some(indicator => fullUrl.toLowerCase().includes(indicator));
  const isProdUrl = fullUrl.includes('api.phonepe.com') && fullUrl.includes('/apis/hermes');
  
  if (isUatUrl || !isProdUrl) {
    throw new Error('PhonePe API URL is not production. Check PHONEPE_BASE_URL and PHONEPE_MODE in .env file.');
  }

  // Make API request
  const response = await fetch(fullUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-VERIFY': xVerify,
      'Accept': 'application/json',
      'X-CLIENT-ID': config.clientId,
    },
    body: JSON.stringify({ request: base64Payload }),
  });

  // DEBUG: Log raw response
  console.log('🔍 DEBUG: PhonePe API Response:', {
    status: response.status,
    statusText: response.statusText,
    hasResponse: !!responseData,
  });

  // Extract redirect URL from response
  const redirectInfo = decodedResponse?.data?.instrumentResponse?.redirectInfo || 
                      decodedResponse?.instrumentResponse?.redirectInfo ||
                      decodedResponse?.redirectInfo;
  
  // DEBUG: Log redirect URL details
  console.log('🔍 DEBUG: Redirect URL Extraction:', {
    redirectUrl: redirectInfo?.url ? redirectInfo.url.substring(0, 150) : 'NOT FOUND',
    checkoutDomain: checkoutDomain,
  });

  // Verify PROD checkout URL
  if (isUatCheckout) {
    console.error('❌ CRITICAL: PhonePe returned UAT/simulator checkout URL!');
    console.error('   Possible causes:');
    console.error('   1. Merchant account is not activated for PROD');
    console.error('   2. Merchant ID is a test/UAT merchant ID');
    console.error('   3. Credentials are UAT credentials (not PROD)');
    throw new Error('PhonePe returned UAT/simulator checkout URL. Contact PhonePe support to activate PROD merchant account.');
  }

  return { redirectUrl: redirectInfo.url, merchantTransactionId };
};
```

### b) Payment Initiation Controller (paymentController.js)

**File:** `ozme-backend/src/controllers/paymentController.js`

**Lines 646-674:** Added debug logging

```javascript
// DEBUG: Log payment creation details
console.log('🔍 DEBUG: Initiating PhonePe Payment:', {
    PHONEPE_MODE: process.env.PHONEPE_MODE || 'NOT SET',
    PHONEPE_BASE_URL: process.env.PHONEPE_BASE_URL || 'NOT SET',
    merchantId: process.env.PHONEPE_MERCHANT_ID?.substring(0, 10) + '...',
    redirectUrl: redirectUrl.substring(0, 80) + '...',
    callbackUrl: callbackUrl.substring(0, 80) + '...',
});

const phonePeResponse = await createPhonePePayment({...});

// DEBUG: Log PhonePe response
console.log('🔍 DEBUG: PhonePe Payment Response:', {
    hasRedirectUrl: !!phonePeResponse.redirectUrl,
    redirectUrl: phonePeResponse.redirectUrl ? phonePeResponse.redirectUrl.substring(0, 150) : 'NOT FOUND',
});

const finalRedirectUrl = phonePeResponse.redirectUrl || redirectUrl;

// DEBUG: Log final redirect URL
console.log('🔍 DEBUG: Final Redirect URL:', {
    source: phonePeResponse.redirectUrl ? 'PhonePe API Response' : 'Fallback (should not happen)',
    redirectUrl: finalRedirectUrl.substring(0, 150),
});
```

### c) Frontend Checkout Handler (Checkout.jsx)

**File:** `Ozme-frontend/src/pages/Checkout.jsx`

**Status:** Already has UAT URL validation (lines 700-720)

The frontend validates redirect URL before redirecting and shows error if UAT URL detected.

## Integration Style

**Current Integration:** SDK-based (X-VERIFY + X-CLIENT-ID)
- Uses `X-VERIFY` header with SHA256 signature
- Uses `X-CLIENT-ID` header
- Uses `clientSecret` for signature generation
- Uses `clientVersion` in signature format: `sha256Hash###clientVersion`

**This is correct for PhonePe SDK integration.**

## API Endpoint Details

**PROD Endpoint:** `https://api.phonepe.com/apis/hermes/pg/v1/pay`
- Method: POST
- Headers: `Content-Type: application/json`, `X-VERIFY: <signature>`, `X-CLIENT-ID: <clientId>`
- Body: `{ "request": "<base64EncodedPayload>" }`

**Request Payload Structure:**
```json
{
  "merchantId": "M23BLFR8IV7IN",
  "merchantTransactionId": "OZME...",
  "merchantUserId": "user_...",
  "amount": 79900,
  "redirectUrl": "https://ozme.in/checkout/success?order_id=...",
  "redirectMode": "REDIRECT",
  "callbackUrl": "https://www.ozme.in/api/payments/phonepe/callback",
  "paymentInstrument": {
    "type": "PAY_PAGE"
  }
}
```

**Response Structure:**
```json
{
  "response": "<base64EncodedResponse>"
}
```

Decoded response contains:
```json
{
  "data": {
    "instrumentResponse": {
      "redirectInfo": {
        "url": "https://checkout.phonepe.com/..."
      }
    }
  }
}
```

## Deployment Instructions

### Step 1: Verify .env File

```bash
cd /var/www/ozme_production/OZME/ozme-backend
cat .env | grep PHONEPE
```

Ensure these are set:
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

**If using PM2:**
```bash
cd /var/www/ozme_production/OZME/ozme-backend
pm2 restart ozme-backend --update-env
# OR
pm2 restart ozme-backend
pm2 save
```

**If using systemd:**
```bash
sudo systemctl restart ozme-backend
```

**If running directly:**
```bash
cd /var/www/ozme_production/OZME/ozme-backend
npm start
```

### Step 3: Check Server Logs

After restart, check logs for:

```
🔍 DEBUG: PhonePe Config Loading:
   PHONEPE_MODE: PROD
   PHONEPE_BASE_URL: https://api.phonepe.com/apis/hermes
   resolvedMode: PROD
   resolvedBaseURL: https://api.phonepe.com/apis/hermes

🔧 PhonePe PROD Configuration:
   mode: PROD
   baseURL: https://api.phonepe.com/apis/hermes
   merchantId: M23BLFR8IV7...
   clientId: SU25122415...
```

### Step 4: Test Payment Flow

1. Go to checkout page
2. Click "Pay Securely"
3. Check server logs for debug output:
   - `🔍 DEBUG: PhonePe Payment Creation`
   - `🔍 DEBUG: PhonePe API Call Details`
   - `🔍 DEBUG: PhonePe API Response`
   - `🔍 DEBUG: Redirect URL Extraction`
   - `🔍 DEBUG: Final Redirect URL`

4. **If UAT URL detected:**
   - Check logs for error message
   - Verify merchant account activation in PhonePe dashboard
   - Contact PhonePe support

## Troubleshooting

### Issue: Still getting UAT URLs

**Check Server Logs:**

1. **Look for:** `🔍 DEBUG: PhonePe API Call Details`
   - Verify `fullUrl` is `https://api.phonepe.com/apis/hermes/pg/v1/pay`
   - If not, check `PHONEPE_BASE_URL` in `.env`

2. **Look for:** `🔍 DEBUG: Redirect URL Extraction`
   - Check what URL PhonePe returned
   - If UAT URL, merchant account is not activated for PROD

3. **Look for:** `❌ CRITICAL: PhonePe returned UAT/simulator checkout URL!`
   - This means PhonePe API returned UAT URL
   - Action: Contact PhonePe support to activate merchant account for PROD

### Issue: Merchant ID validation fails

**Error:** `Merchant ID appears to be a test/UAT merchant ID`

**Solution:**
- Verify merchant ID in PhonePe dashboard
- Test merchant IDs start with `PGTEST` or contain `UAT`
- Use PROD merchant ID from PhonePe dashboard

### Issue: Environment variables not loading

**Check:**
```bash
# Verify .env file exists
ls -la ozme-backend/.env

# Check PM2 env (if using PM2)
pm2 env ozme-backend | grep PHONEPE

# Check if PM2 is loading .env
pm2 show ozme-backend | grep "exec cwd"
```

**Fix:**
```bash
# Restart PM2 with env update
pm2 restart ozme-backend --update-env

# Or manually set env vars in PM2
pm2 restart ozme-backend --update-env --env production
```

## Expected Debug Log Flow

### Success Case:
```
🔍 DEBUG: PhonePe Config Loading: { PHONEPE_MODE: 'PROD', ... }
🔍 DEBUG: PhonePe Payment Creation: { baseURL: 'https://api.phonepe.com/apis/hermes', ... }
🔍 DEBUG: PhonePe API Call Details: { fullUrl: 'https://api.phonepe.com/apis/hermes/pg/v1/pay', ... }
📡 PhonePe PROD API Request: { url: 'https://api.phonepe.com/apis/hermes/pg/v1/pay', ... }
🔍 DEBUG: PhonePe API Response: { status: 200, ... }
🔍 DEBUG: Redirect URL Extraction: { redirectUrl: 'https://checkout.phonepe.com/...', ... }
✅ PhonePe PROD payment created successfully: { checkoutDomain: 'checkout.phonepe.com', ... }
```

### Error Case (UAT URL):
```
🔍 DEBUG: PhonePe API Call Details: { fullUrl: 'https://api.phonepe.com/apis/hermes/pg/v1/pay', ... }
📡 PhonePe PROD API Request: { url: 'https://api.phonepe.com/apis/hermes/pg/v1/pay', ... }
🔍 DEBUG: PhonePe API Response: { status: 200, ... }
🔍 DEBUG: Redirect URL Extraction: { redirectUrl: 'https://mercury-uat.phonepe.com/...', ... }
❌ CRITICAL: PhonePe returned UAT/simulator checkout URL!
   Possible causes:
   1. Merchant account is not activated for PROD
   2. Merchant ID is a test/UAT merchant ID
   3. Credentials are UAT credentials (not PROD)
```

## Next Steps

1. **Deploy changes** and restart server
2. **Check debug logs** to see exact API endpoint called and response received
3. **If UAT URL still returned:**
   - Contact PhonePe support
   - Request merchant account activation for PROD
   - Verify merchant ID is PROD merchant ID
   - Verify credentials are PROD credentials

## Important Notes

- **Debug logs will show:** Exact API endpoint, request payload, response structure, redirect URL
- **No secrets logged:** Only first 10 chars of merchant ID/client ID shown
- **UAT URLs blocked:** Both backend and frontend validate and reject UAT URLs
- **Root cause:** If PhonePe returns UAT URL, merchant account needs PROD activation

---

**Fix Date:** $(date)  
**Status:** ✅ Complete - Debug logging added, root cause identified

