# PhonePe PROD Integration - Signature Fix

## Root Cause Identified

The code was using **incorrect secrets** for X-VERIFY signature generation:
- ❌ **Before**: Used `clientSecret` for signature hash
- ❌ **Before**: Used `clientVersion` instead of `saltIndex`
- ✅ **After**: Uses `SALT_KEY` for signature hash
- ✅ **After**: Uses `SALT_INDEX` for signature suffix

## Integration Type

**SDK-based Integration** with the following characteristics:
- Uses `CLIENT_ID` and `CLIENT_SECRET` for authentication/authorization
- **BUT** X-VERIFY signature still requires `SALT_KEY` and `SALT_INDEX` (not clientSecret)
- Headers sent: `X-VERIFY`, `X-CLIENT-ID`, `Content-Type`, `Accept`

## Signature Format

```
sha256(base64Payload + endpoint + SALT_KEY) + "###" + SALT_INDEX
```

**Example:**
```
sha256("eyJtZXJjaGFudElkIjoiTTIzQkxGUjhJVjdJTiIs..." + "/pg/v1/pay" + "your-salt-key-here") + "###" + "1"
```

## Required Environment Variables

### Required for PROD:
```env
PHONEPE_MODE=PROD
PHONEPE_BASE_URL=https://api.phonepe.com/apis/hermes
PHONEPE_MERCHANT_ID=M23BLFR8IV7IN
PHONEPE_CLIENT_ID=SU2512241530570377413815
PHONEPE_CLIENT_SECRET=your-client-secret-here
PHONEPE_SALT_KEY=your-salt-key-here  # REQUIRED for X-VERIFY signature
PHONEPE_SALT_INDEX=1                 # Usually "1", defaults to "1" if not set
PHONEPE_CLIENT_VERSION=1             # Optional, defaults to "1"
PHONEPE_RETURN_URL=https://ozme.in/checkout/success?order_id={order_id}
PHONEPE_CALLBACK_URL=https://www.ozme.in/api/payments/phonepe/callback
PHONEPE_WEBHOOK_USERNAME=ozme_perfume
PHONEPE_WEBHOOK_PASSWORD=Ozme9Secure
```

### Critical Notes:
1. **SALT_KEY is REQUIRED** - Even SDK-based integration uses SALT_KEY (not clientSecret) for X-VERIFY signature
2. **SALT_INDEX** - Usually "1", must match PhonePe dashboard configuration
3. **CLIENT_SECRET** - Used for OAuth/authentication, NOT for signature
4. **CLIENT_VERSION** - Used for SDK versioning, NOT for signature

## Files Changed

### 1. `ozme-backend/src/utils/phonepe.js`
- ✅ Updated `getPhonePeConfig()` to load `PHONEPE_SALT_KEY` and `PHONEPE_SALT_INDEX`
- ✅ Added validation to ensure `SALT_KEY` is configured
- ✅ Updated `generateXVerifySignature()` to use `SALT_KEY` instead of `clientSecret`
- ✅ Updated signature format to use `SALT_INDEX` instead of `clientVersion`
- ✅ Added detailed logging for headers and signature generation
- ✅ Added `testPhonePeIntegration()` function for testing

### 2. `ozme-backend/src/controllers/paymentController.js`
- ✅ Added validation to ensure `PHONEPE_SALT_KEY` is configured
- ✅ Updated logging to show SALT_KEY and SALT_INDEX status

### 3. `ozme-backend/src/server.js`
- ✅ Updated startup logging to show SALT_KEY and SALT_INDEX configuration
- ✅ Added warning if SALT_KEY is missing

## Code Changes

### Signature Generation (Before vs After)

**Before (INCORRECT):**
```javascript
const stringToHash = base64Payload + endpoint + config.clientSecret;
const sha256Hash = crypto.createHash('sha256').update(stringToHash).digest('hex');
return `${sha256Hash}###${config.clientVersion}`;
```

**After (CORRECT):**
```javascript
const stringToHash = base64Payload + endpoint + config.saltKey;
const sha256Hash = crypto.createHash('sha256').update(stringToHash).digest('hex');
return `${sha256Hash}###${config.saltIndex}`;
```

### Headers Sent

```javascript
{
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'X-VERIFY': 'sha256(...)###1',  // Uses SALT_KEY + SALT_INDEX
  'X-CLIENT-ID': 'SU2512241530570377413815'
}
```

## Testing

### 1. Verify Environment Variables

Check server logs on startup:
```bash
tail -f /var/www/ozme_production/OZME/ozme-backend/server.log
```

Look for:
```
💳 PhonePe Configuration:
   MODE: PROD
   BASE_URL: https://api.phonepe.com/apis/hermes
   MERCHANT_ID: M23BLFR8IV7IN...
   CLIENT_ID: SU2512241530570377413815...
   SALT_KEY: ✓ Set (length: XX)
   SALT_INDEX: 1
   Integration Style: SDK-based (X-VERIFY uses SALT_KEY + SALT_INDEX)
```

### 2. Test Payment Flow

1. Go to https://ozme.in/checkout
2. Fill shipping details
3. Select "Online Payment via PhonePe"
4. Click "Pay Securely"
5. **Expected**: Redirect to PhonePe PROD payment page (NOT mercury-uat or merchant-simulator)

### 3. Check Logs During Payment

Look for these log entries:
```
🔐 X-VERIFY Signature Generated:
   endpoint: /pg/v1/pay
   saltKeyLength: XX
   saltIndex: 1
   signatureFormat: sha256(base64Payload + endpoint + SALT_KEY) + "###" + SALT_INDEX

📤 PhonePe Request Details (Headers):
   X-VERIFY: sha256(...)###1
   X-CLIENT-ID: SU2512241530570377413815
   X-VERIFY-Format: sha256(base64Payload + endpoint + SALT_KEY) + "###" + SALT_INDEX
   X-VERIFY-SaltIndex: 1

🔍 DEBUG: Redirect URL Details:
   redirectUrl: https://mercury.phonepe.com/...
   checkoutDomain: mercury.phonepe.com
   isUatDomain: false
```

### 4. Use Test Function

You can call the test function programmatically:
```javascript
import { testPhonePeIntegration } from './src/utils/phonepe.js';

const result = await testPhonePeIntegration({
  merchantTransactionId: `TEST_${Date.now()}`,
  amountPaise: 10000,
});

console.log('Full URL Called:', result.fullUrlCalled);
console.log('Redirect Domain:', result.redirectDomain);
console.log('Is UAT Domain:', result.isUatDomain);
```

## Expected Behavior After Fix

1. ✅ X-VERIFY signature uses `SALT_KEY` (not clientSecret)
2. ✅ Signature format uses `SALT_INDEX` (not clientVersion)
3. ✅ PhonePe API accepts the signature and returns PROD redirect URL
4. ✅ Redirect URL domain: `mercury.phonepe.com` (NOT `mercury-uat.phonepe.com` or `merchant-simulator.phonepe.com`)
5. ✅ Payment page is PROD (not simulator/UAT)

## Troubleshooting

### If Still Getting UAT URLs:

1. **Verify SALT_KEY matches PhonePe dashboard:**
   - Log in to PhonePe Merchant Dashboard
   - Go to API Credentials section
   - Verify SALT_KEY matches `PHONEPE_SALT_KEY` in `.env`

2. **Verify SALT_INDEX matches PhonePe dashboard:**
   - Usually "1", but verify in PhonePe dashboard
   - Update `PHONEPE_SALT_INDEX` if different

3. **Check signature in logs:**
   - Look for `🔐 X-VERIFY Signature Generated` log
   - Verify `saltKeyLength` matches your SALT_KEY length
   - Verify `saltIndex` matches PhonePe dashboard

4. **Verify merchant account is activated for PROD:**
   - Contact PhonePe support if merchant account is not activated
   - Ensure merchant ID `M23BLFR8IV7IN` is PROD (not UAT)

5. **Check API response:**
   - Look for `🔍 DEBUG: Redirect URL Details` log
   - If `isUatDomain: true`, PhonePe is returning UAT URL
   - This indicates signature or merchant account issue

## Deployment

1. **Update `.env` file:**
   ```bash
   # Add these if missing:
   PHONEPE_SALT_KEY=your-salt-key-from-phonepe-dashboard
   PHONEPE_SALT_INDEX=1
   ```

2. **Restart backend server:**
   ```bash
   cd /var/www/ozme_production/OZME/ozme-backend
   pm2 restart ozme-backend --update-env
   # OR
   systemctl restart ozme-backend
   ```

3. **Verify startup logs:**
   ```bash
   tail -f /var/www/ozme_production/OZME/ozme-backend/server.log
   ```
   Look for `SALT_KEY: ✓ Set` in PhonePe Configuration section

4. **Test payment flow:**
   - Go to checkout page
   - Click "Pay Securely"
   - Verify redirect URL is PROD (not UAT/simulator)

## Summary

The root cause was using `clientSecret` and `clientVersion` for X-VERIFY signature instead of `SALT_KEY` and `SALT_INDEX`. Even SDK-based PhonePe integration requires SALT_KEY for signature generation. After this fix, the signature will be valid and PhonePe will return PROD redirect URLs instead of UAT/simulator URLs.

