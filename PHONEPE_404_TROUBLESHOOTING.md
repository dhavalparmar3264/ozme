# PhonePe 404 Error Troubleshooting Guide

## Error: `Failed to create PhonePe payment: HTTP 404`

This error indicates that PhonePe's API is returning a 404 (Not Found) response. This usually means:

1. **PhonePe credentials are missing or incorrect**
2. **Wrong API endpoint URL**
3. **Merchant account not activated for API access**
4. **Wrong environment (PROD vs UAT)**

## ✅ Fixes Applied

1. **Updated UAT Base URL**: Changed from `api-preprod.phonepe.com` to `api-testing.phonepe.com`
2. **Added Detailed Logging**: Now logs the full API URL, merchant ID, and request details
3. **Enhanced Error Messages**: Better error reporting in server logs

## 🔍 Troubleshooting Steps

### Step 1: Verify Environment Variables

Check if PhonePe credentials are set in `ozme-backend/.env`:

```bash
cd /var/www/ozme_production/OZME/ozme-backend
grep PHONEPE .env
```

You should see:
```env
PHONEPE_CLIENT_ID=your_merchant_id
PHONEPE_CLIENT_SECRET=your_merchant_secret
PHONEPE_ENV=PROD  # or UAT
PHONEPE_SALT_INDEX=1
PHONEPE_RETURN_URL=https://ozme.in/order-success?order_id={order_id}
PHONEPE_CALLBACK_URL=https://ozme.in/api/payments/phonepe/callback
```

### Step 2: Check Server Logs

View detailed error logs:
```bash
tail -f /var/www/ozme_production/OZME/ozme-backend/server.log
```

Look for:
- `📡 PhonePe API Request:` - Shows the URL being called
- `❌ PhonePe payment creation failed:` - Shows the error details
- `✅ PhonePe configuration check passed:` - Confirms credentials are loaded

### Step 3: Verify PhonePe Merchant Account

1. **Login to PhonePe Merchant Dashboard**
2. **Check API Access**: Ensure your merchant account has API access enabled
3. **Verify Credentials**: 
   - Merchant ID (PHONEPE_CLIENT_ID)
   - Merchant Secret (PHONEPE_CLIENT_SECRET)
   - Salt Index (PHONEPE_SALT_INDEX, usually "1")

### Step 4: Test with UAT Environment First

For testing, use UAT environment:

```env
PHONEPE_ENV=UAT
PHONEPE_CLIENT_ID=your_uat_merchant_id
PHONEPE_CLIENT_SECRET=your_uat_merchant_secret
```

Then restart the server:
```bash
cd /var/www/ozme_production/OZME/ozme-backend
lsof -ti:3002 | xargs kill -9
nohup node src/server.js > server.log 2>&1 &
```

### Step 5: Verify API Endpoint

The correct endpoints are:
- **Production**: `https://api.phonepe.com/apis/hermes/pg/v1/pay`
- **UAT**: `https://api-testing.phonepe.com/apis/hermes/pg/v1/pay`

Check server logs to see what URL is being called.

### Step 6: Common Issues

#### Issue 1: Credentials Not Set
**Error**: "PhonePe credentials not configured"
**Fix**: Add credentials to `.env` and restart server

#### Issue 2: Wrong Merchant ID
**Error**: HTTP 404 from PhonePe
**Fix**: Verify merchant ID matches your PhonePe dashboard

#### Issue 3: API Access Not Enabled
**Error**: HTTP 404 from PhonePe
**Fix**: Contact PhonePe support to enable API access for your merchant account

#### Issue 4: Wrong Environment
**Error**: HTTP 404 from PhonePe
**Fix**: Ensure `PHONEPE_ENV` matches your credentials (PROD credentials with PROD env, UAT credentials with UAT env)

## 📋 Testing Checklist

- [ ] PhonePe credentials added to `.env`
- [ ] Server restarted after adding credentials
- [ ] `PHONEPE_ENV` set correctly (PROD or UAT)
- [ ] Merchant account has API access enabled
- [ ] Credentials match PhonePe dashboard
- [ ] Salt index is correct (usually "1")
- [ ] Callback URL is publicly accessible
- [ ] Return URL is correct

## 🔧 Quick Fix Commands

```bash
# 1. Check if credentials are set
cd /var/www/ozme_production/OZME/ozme-backend
grep PHONEPE .env

# 2. View server logs
tail -f server.log

# 3. Restart server
lsof -ti:3002 | xargs kill -9
nohup node src/server.js > server.log 2>&1 &

# 4. Test health endpoint
curl http://localhost:3002/api/health
```

## 📞 Next Steps

1. **Add PhonePe Credentials**: If not set, add them to `.env`
2. **Restart Server**: After adding credentials, restart the server
3. **Check Logs**: Monitor server logs for detailed error messages
4. **Test Payment**: Try the payment flow again
5. **Contact PhonePe**: If 404 persists, contact PhonePe support with:
   - Merchant ID
   - Error logs
   - API endpoint being called

## 📝 Expected Log Output (Success)

When working correctly, you should see:
```
📥 PhonePe payment request received: { orderId: '...', amount: 799, ... }
✅ Order found: OZME-XXXXXXXX
✅ PhonePe configuration check passed: { hasClientId: true, ... }
🔄 Creating PhonePe payment...
📡 PhonePe API Request: { url: 'https://api.phonepe.com/apis/hermes/pg/v1/pay', ... }
✅ PhonePe payment created successfully: { merchantTransactionId: '...', ... }
```

## 📝 Expected Log Output (Error)

If credentials are missing:
```
❌ PhonePe credentials not configured!
   PHONEPE_CLIENT_ID: ✗ Missing
   PHONEPE_CLIENT_SECRET: ✗ Missing
```

If API returns 404:
```
📡 PhonePe API Request: { url: '...', merchantId: '...', ... }
❌ PhonePe payment creation failed: { status: 404, error: '...', ... }
```

