# PhonePe Integration Audit - Complete

## Integration Type Identified

**SDK-based Integration** using:
- `X-VERIFY` header with signature (uses `SALT_KEY` + `SALT_INDEX`)
- `X-CLIENT-ID` header for authentication
- Signature format: `sha256(base64Payload + endpoint + SALT_KEY) + "###" + SALT_INDEX`

## Root Cause

The code was using **incorrect secrets** for signature:
- ❌ Used `clientSecret` instead of `SALT_KEY`
- ❌ Used `clientVersion` instead of `SALT_INDEX`

This caused PhonePe to reject the signature or return UAT URLs.

## Files Changed

### 1. `ozme-backend/src/utils/phonepe.js`

#### Updated `getPhonePeConfig()`:
```javascript
// Added SALT_KEY and SALT_INDEX loading
const saltKey = process.env.PHONEPE_SALT_KEY;
const saltIndex = process.env.PHONEPE_SALT_INDEX || '1';

// Added validation
if (!saltKey) {
  throw new Error(
    'PhonePe PROD SALT_KEY not configured. Please set PHONEPE_SALT_KEY in your .env file. This is REQUIRED for X-VERIFY signature generation in PROD.'
  );
}

// Updated return object
return {
  merchantId,
  clientId,
  clientSecret,
  clientVersion,
  saltKey,        // NEW
  saltIndex,      // NEW
  baseURL,
  environment: 'PROD',
};
```

#### Updated `generateXVerifySignature()`:
```javascript
// BEFORE (INCORRECT):
const stringToHash = base64Payload + endpoint + config.clientSecret;
const sha256Hash = crypto.createHash('sha256').update(stringToHash).digest('hex');
return `${sha256Hash}###${config.clientVersion}`;

// AFTER (CORRECT):
const stringToHash = base64Payload + endpoint + config.saltKey;
const sha256Hash = crypto.createHash('sha256').update(stringToHash).digest('hex');
const signature = `${sha256Hash}###${config.saltIndex}`;
return signature;
```

#### Added Detailed Logging:
```javascript
console.log('📤 PhonePe Request Details (Headers):', {
  url: fullUrl,
  method: 'POST',
  headers: {
    'Content-Type': requestHeaders['Content-Type'],
    'Accept': requestHeaders['Accept'],
    'X-VERIFY': xVerify.substring(0, 30) + '... (full length: ' + xVerify.length + ')',
    'X-CLIENT-ID': config.clientId,
    'X-VERIFY-Format': 'sha256(base64Payload + endpoint + SALT_KEY) + "###" + SALT_INDEX',
    'X-VERIFY-SaltIndex': config.saltIndex,
  },
  signatureDetails: {
    usesSaltKey: true,
    usesSaltIndex: true,
    saltKeyLength: config.saltKey?.length || 0,
    saltIndex: config.saltIndex,
  },
});
```

#### Added Test Function:
```javascript
export const testPhonePeIntegration = async ({...}) => {
  // Tests integration and prints fullUrl + redirect domain
  // Returns: { fullUrlCalled, redirectDomain, isUatDomain, ... }
};
```

### 2. `ozme-backend/src/controllers/paymentController.js`

#### Added SALT_KEY Validation:
```javascript
// Added check for SALT_KEY
const hasSaltKey = !!process.env.PHONEPE_SALT_KEY;

if (!hasSaltKey) {
  console.error('❌ PhonePe PROD SALT_KEY not configured!');
  console.error('   PHONEPE_SALT_KEY:', '✗ Missing (REQUIRED for X-VERIFY signature)');
  console.error('   Note: Even SDK-based integration uses SALT_KEY (not clientSecret) for signature');
  return res.status(500).json({
    success: false,
    message: 'Payment gateway configuration error. Please contact support.',
    error: 'PhonePe PROD SALT_KEY missing (required for signature)',
  });
}
```

#### Updated Configuration Logging:
```javascript
console.log('✅ PhonePe PROD configuration validated:', {
  mode: 'PROD',
  baseURL: process.env.PHONEPE_BASE_URL || 'https://api.phonepe.com/apis/hermes',
  merchantId: process.env.PHONEPE_MERCHANT_ID?.substring(0, 10) + '...',
  clientId: process.env.PHONEPE_CLIENT_ID?.substring(0, 10) + '...',
  clientVersion: process.env.PHONEPE_CLIENT_VERSION || '1',
  hasSaltKey: true,                    // NEW
  saltIndex: process.env.PHONEPE_SALT_INDEX || '1',  // NEW
  integrationStyle: 'SDK-based (X-VERIFY uses SALT_KEY + SALT_INDEX)',  // NEW
});
```

### 3. `ozme-backend/src/server.js`

#### Updated Startup Logging:
```javascript
console.log(`   SALT_KEY: ${process.env.PHONEPE_SALT_KEY ? '✓ Set (length: ' + process.env.PHONEPE_SALT_KEY.length + ')' : '✗ NOT SET (REQUIRED for X-VERIFY signature)'}`);
console.log(`   SALT_INDEX: ${process.env.PHONEPE_SALT_INDEX || 'NOT SET (defaults to "1")'}`);
console.log(`   Integration Style: SDK-based (X-VERIFY uses SALT_KEY + SALT_INDEX)`);

// Added validation warning
if (!process.env.PHONEPE_SALT_KEY) {
  console.error(`   ❌ ERROR: PHONEPE_SALT_KEY is REQUIRED for X-VERIFY signature in PROD`);
  console.error(`   Note: Even SDK-based integration uses SALT_KEY (not clientSecret) for signature`);
}
```

## Required Environment Variables

### Complete List:
```env
# Mode (must be PROD)
PHONEPE_MODE=PROD

# Base URL (PROD endpoint)
PHONEPE_BASE_URL=https://api.phonepe.com/apis/hermes

# SDK Credentials
PHONEPE_MERCHANT_ID=M23BLFR8IV7IN
PHONEPE_CLIENT_ID=SU2512241530570377413815
PHONEPE_CLIENT_SECRET=your-client-secret-here

# Signature Credentials (REQUIRED for X-VERIFY)
PHONEPE_SALT_KEY=your-salt-key-here  # REQUIRED - Get from PhonePe dashboard
PHONEPE_SALT_INDEX=1                  # Usually "1", defaults to "1"

# Optional SDK Version
PHONEPE_CLIENT_VERSION=1             # Optional, defaults to "1"

# URLs
PHONEPE_RETURN_URL=https://ozme.in/checkout/success?order_id={order_id}
PHONEPE_CALLBACK_URL=https://www.ozme.in/api/payments/phonepe/callback

# Webhook Auth
PHONEPE_WEBHOOK_USERNAME=ozme_perfume
PHONEPE_WEBHOOK_PASSWORD=Ozme9Secure
```

## Headers Sent to PhonePe API

```javascript
{
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'X-VERIFY': 'sha256(base64Payload + endpoint + SALT_KEY)###SALT_INDEX',
  'X-CLIENT-ID': 'SU2512241530570377413815'
}
```

## Signature Generation Details

### Input:
- `base64Payload`: Base64-encoded JSON payload
- `endpoint`: API endpoint path (e.g., `/pg/v1/pay`)
- `SALT_KEY`: From PhonePe dashboard (NOT clientSecret)
- `SALT_INDEX`: Usually "1" (NOT clientVersion)

### Process:
1. Concatenate: `base64Payload + endpoint + SALT_KEY`
2. Hash with SHA256: `sha256(stringToHash)`
3. Format: `hash + "###" + SALT_INDEX`

### Example:
```javascript
const stringToHash = "eyJtZXJjaGFudElkIjoiTTIzQkxGUjhJVjdJTiIs..." + "/pg/v1/pay" + "your-salt-key";
const hash = sha256(stringToHash); // "a1b2c3d4e5f6..."
const signature = hash + "###" + "1"; // "a1b2c3d4e5f6...###1"
```

## Testing

### 1. Verify Configuration on Startup

Check server logs:
```bash
tail -f /var/www/ozme_production/OZME/ozme-backend/server.log
```

Expected output:
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
5. **Expected**: Redirect to `mercury.phonepe.com` (NOT `mercury-uat.phonepe.com`)

### 3. Check Logs During Payment

Look for:
```
🔐 X-VERIFY Signature Generated:
   endpoint: /pg/v1/pay
   saltKeyLength: XX
   saltIndex: 1
   signatureFormat: sha256(base64Payload + endpoint + SALT_KEY) + "###" + SALT_INDEX

📤 PhonePe Request Details (Headers):
   X-VERIFY: sha256(...)###1
   X-CLIENT-ID: SU2512241530570377413815
   X-VERIFY-SaltIndex: 1

🔍 DEBUG: Redirect URL Details:
   redirectUrl: https://mercury.phonepe.com/...
   checkoutDomain: mercury.phonepe.com
   isUatDomain: false
```

## Expected Results

After fix:
- ✅ X-VERIFY signature uses `SALT_KEY` (not clientSecret)
- ✅ Signature format uses `SALT_INDEX` (not clientVersion)
- ✅ PhonePe API accepts signature
- ✅ Redirect URL domain: `mercury.phonepe.com` (PROD)
- ✅ Payment page is PROD (not simulator/UAT)

## Deployment Steps

1. **Update `.env` file:**
   ```bash
   # Add if missing:
   PHONEPE_SALT_KEY=your-salt-key-from-phonepe-dashboard
   PHONEPE_SALT_INDEX=1
   ```

2. **Restart backend:**
   ```bash
   cd /var/www/ozme_production/OZME/ozme-backend
   pm2 restart ozme-backend --update-env
   ```

3. **Verify logs:**
   ```bash
   tail -f server.log | grep -i phonepe
   ```

4. **Test payment:**
   - Go to checkout
   - Click "Pay Securely"
   - Verify redirect URL is PROD

## Troubleshooting

### If Still Getting UAT URLs:

1. **Verify SALT_KEY matches PhonePe dashboard**
2. **Verify SALT_INDEX matches PhonePe dashboard** (usually "1")
3. **Check signature logs** - verify `saltKeyLength` and `saltIndex`
4. **Verify merchant account is activated for PROD**
5. **Contact PhonePe support** if merchant account not activated

## Summary

Fixed the root cause: signature was using `clientSecret` and `clientVersion` instead of `SALT_KEY` and `SALT_INDEX`. Even SDK-based PhonePe integration requires SALT_KEY for X-VERIFY signature. After this fix, PhonePe will return PROD redirect URLs.

