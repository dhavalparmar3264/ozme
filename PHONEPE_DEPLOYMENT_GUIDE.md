# PhonePe PROD Deployment Guide

## Quick Summary

Added comprehensive debug logging and validation to identify why PhonePe returns UAT URLs. The root cause is likely that the merchant account (`M23BLFR8IV7IN`) is not fully activated for PROD in PhonePe dashboard.

## Files Changed

1. **`ozme-backend/src/utils/phonepe.js`** - Enhanced validation + debug logging
2. **`ozme-backend/src/controllers/paymentController.js`** - Added debug logging
3. **`ozme-backend/src/server.js`** - Already updated (startup logging)

## Deployment Steps

### 1. Verify .env File

```bash
cd /var/www/ozme_production/OZME/ozme-backend
cat .env | grep PHONEPE
```

**Required variables:**
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

### 2. Restart Backend Server

**PM2 (Recommended):**
```bash
cd /var/www/ozme_production/OZME/ozme-backend
pm2 restart ozme-backend --update-env
pm2 logs ozme-backend --lines 50
```

**systemd:**
```bash
sudo systemctl restart ozme-backend
sudo journalctl -u ozme-backend -f --lines 50
```

**Direct:**
```bash
cd /var/www/ozme_production/OZME/ozme-backend
npm start
```

### 3. Verify Startup Logs

Look for these in server logs:

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

### 4. Test Payment Flow

1. Go to checkout page
2. Click "Pay Securely"
3. **Watch server logs** for debug output

**Expected logs:**
```
🔍 DEBUG: PhonePe Payment Creation: { PHONEPE_MODE: 'PROD', ... }
🔍 DEBUG: PhonePe API Call Details: { fullUrl: 'https://api.phonepe.com/apis/hermes/pg/v1/pay', ... }
📡 PhonePe PROD API Request: { url: 'https://api.phonepe.com/apis/hermes/pg/v1/pay', ... }
🔍 DEBUG: PhonePe API Response: { status: 200, ... }
🔍 DEBUG: Redirect URL Extraction: { redirectUrl: 'https://checkout.phonepe.com/...', ... }
✅ PhonePe PROD payment created successfully
```

**If UAT URL detected:**
```
❌ CRITICAL: PhonePe returned UAT/simulator checkout URL!
   Possible causes:
   1. Merchant account is not activated for PROD
   2. Merchant ID is a test/UAT merchant ID
   3. Credentials are UAT credentials (not PROD)
```

## Debug Log Analysis

### What to Check in Logs

1. **API Endpoint Called:**
   - Look for: `🔍 DEBUG: PhonePe API Call Details`
   - Verify: `fullUrl` = `https://api.phonepe.com/apis/hermes/pg/v1/pay`
   - If different, check `PHONEPE_BASE_URL` in `.env`

2. **Redirect URL Received:**
   - Look for: `🔍 DEBUG: Redirect URL Extraction`
   - Check: `redirectUrl` value
   - If contains `mercury-uat` or `merchant-simulator`, PhonePe API returned UAT URL

3. **Merchant ID Validation:**
   - Look for: `❌ CRITICAL: Merchant ID appears to be a test/UAT merchant ID!`
   - If seen, merchant ID is a test ID (starts with PGTEST)

## Root Cause Resolution

If PhonePe still returns UAT URLs after deployment:

### Step 1: Verify Merchant Account Status

1. Login to PhonePe Merchant Dashboard
2. Go to Settings → API Credentials
3. Check:
   - Merchant ID matches `M23BLFR8IV7IN`
   - Environment shows "PRODUCTION" (not "UAT" or "TEST")
   - API Credentials are marked as "PRODUCTION"

### Step 2: Contact PhonePe Support

If merchant account shows UAT/TEST status:

1. **Contact PhonePe Support:**
   - Email: support@phonepe.com
   - Phone: PhonePe support number
   - Dashboard: Raise support ticket

2. **Request:**
   - Activate merchant account for PRODUCTION
   - Verify merchant ID `M23BLFR8IV7IN` is PROD merchant ID
   - Provide PROD API credentials if current ones are UAT

3. **Provide:**
   - Merchant ID: `M23BLFR8IV7IN`
   - Current issue: API returns UAT URLs when calling PROD endpoint
   - Request: Activate merchant account for PRODUCTION environment

### Step 3: Verify Credentials

After PhonePe activates PROD:

1. **Get PROD Credentials:**
   - Login to PhonePe Merchant Dashboard
   - Go to API Credentials → Production
   - Copy:
     - Merchant ID (should be `M23BLFR8IV7IN`)
     - Client ID
     - Client Secret

2. **Update .env:**
   ```env
   PHONEPE_MERCHANT_ID=M23BLFR8IV7IN
   PHONEPE_CLIENT_ID=<PROD_CLIENT_ID>
   PHONEPE_CLIENT_SECRET=<PROD_CLIENT_SECRET>
   ```

3. **Restart Server:**
   ```bash
   pm2 restart ozme-backend --update-env
   ```

## Verification Checklist

After deployment:

- [ ] Server logs show `PHONEPE_MODE: PROD`
- [ ] Server logs show `BASE_URL: https://api.phonepe.com/apis/hermes`
- [ ] Debug logs show API endpoint: `https://api.phonepe.com/apis/hermes/pg/v1/pay`
- [ ] Debug logs show redirect URL from PhonePe API
- [ ] If UAT URL detected, error message shown with actionable steps
- [ ] Frontend blocks UAT URLs (shows error message)

## Expected Behavior

### ✅ Success (PROD URL):
- API endpoint: `https://api.phonepe.com/apis/hermes/pg/v1/pay`
- Redirect URL: `https://checkout.phonepe.com/...` (PROD domain)
- User redirected to PhonePe PROD payment page

### ❌ Error (UAT URL):
- API endpoint: `https://api.phonepe.com/apis/hermes/pg/v1/pay` (correct)
- Redirect URL: `https://mercury-uat.phonepe.com/...` (UAT domain)
- Error thrown: "PhonePe returned UAT/simulator checkout URL"
- User sees error: "Payment gateway is in TEST mode. Please contact support."

## Support

If issues persist:

1. **Check Debug Logs:**
   - Look for `🔍 DEBUG:` entries in server logs
   - Share logs with PhonePe support

2. **Contact PhonePe:**
   - Request merchant account activation for PROD
   - Verify merchant ID is PROD merchant ID
   - Request PROD API credentials

3. **Verify Integration:**
   - API endpoint is correct: `https://api.phonepe.com/apis/hermes/pg/v1/pay`
   - Request payload structure is correct
   - Headers include `X-VERIFY` and `X-CLIENT-ID`

---

**Deployment Date:** $(date)  
**Status:** ✅ Ready for deployment - Debug logging active

