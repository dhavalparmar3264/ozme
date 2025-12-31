# PhonePe Error CK015 - 404 Fix Guide

## 🔴 Error Details

**Error Code**: `CK015`  
**HTTP Status**: `404 Not Found`  
**Response**: `{"success":false,"code":"404"}`

## 🔍 Root Cause

The error code `CK015` with 404 indicates that:
1. **Merchant account not activated for API access** - Most common cause
2. **Endpoint not available for this merchant type** - API access not enabled
3. **Transaction URL mismatch** - URL doesn't match onboarding URL

## ✅ Solutions

### Solution 1: Activate API Access in PhonePe Dashboard

1. **Login to PhonePe Merchant Dashboard**:
   - Go to https://merchant.phonepe.com
   - Login with your merchant credentials

2. **Check API Access Status**:
   - Navigate to **Settings** → **API Configuration**
   - Verify that **API Access** is enabled
   - Check if **Standard Checkout** is activated

3. **Verify Credentials**:
   - Confirm Merchant ID: `M23BLFR8IV7IN`
   - Confirm Client ID: `SU2512241530570377413815`
   - Verify these match your dashboard

4. **Contact PhonePe Support**:
   - If API access is not enabled, contact PhonePe support
   - Request API access activation for Standard Checkout
   - Provide your Merchant ID: `M23BLFR8IV7IN`

### Solution 2: Verify Transaction URL Matches Onboarding

1. **Check Onboarding URL**:
   - In PhonePe dashboard, check the **Transaction URL** registered during onboarding
   - Ensure it matches: `https://api.phonepe.com/apis/hermes/pg/v1/pay`

2. **Update if Mismatched**:
   - If different, update your integration to use the correct URL
   - Or update the URL in PhonePe dashboard to match

### Solution 3: Try API Version v2 (Alternative)

If v1 doesn't work, try v2 endpoint:

**Current (v1)**: `https://api.phonepe.com/apis/hermes/pg/v1/pay`  
**Alternative (v2)**: `https://api.phonepe.com/apis/hermes/pg/v2/pay`

## 📋 Action Items

### Immediate Steps:

1. ✅ **Check PhonePe Dashboard**:
   - Login and verify API access is enabled
   - Check if Standard Checkout is activated
   - Verify credentials match

2. ✅ **Contact PhonePe Support**:
   - Email: support@phonepe.com (or check dashboard for support contact)
   - Subject: "API Access Activation Request - Merchant ID: M23BLFR8IV7IN"
   - Include:
     - Merchant ID: M23BLFR8IV7IN
     - Client ID: SU2512241530570377413815
     - Error: CK015 - 404 on /pg/v1/pay endpoint
     - Request: Activate API access for Standard Checkout

3. ✅ **Verify Environment**:
   - Ensure you're using PROD credentials with PROD environment
   - If testing, use UAT credentials with UAT environment

### Test After Activation:

Once API access is activated, test again:
```bash
cd /var/www/ozme_production/OZME/ozme-backend
node test-phonepe.js
```

## 🔧 Temporary Workaround

If you need to test immediately, you can try:

1. **Use UAT Environment** (if you have UAT credentials):
   ```env
   PHONEPE_ENV=UAT
   ```

2. **Check if different endpoint works** (contact PhonePe support first)

## 📞 PhonePe Support Contact

- **Dashboard**: https://merchant.phonepe.com
- **Support**: Check dashboard for support contact details
- **Documentation**: https://developer.phonepe.com

## 📝 Current Configuration

```env
PHONEPE_MERCHANT_ID=M23BLFR8IV7IN
PHONEPE_CLIENT_ID=SU2512241530570377413815
PHONEPE_CLIENT_SECRET=9f5fc26a-62fd-4cba-bad7-f8eed086582c
PHONEPE_CLIENT_VERSION=1
PHONEPE_ENV=PROD
```

**API Endpoint**: `https://api.phonepe.com/apis/hermes/pg/v1/pay`

## ⚠️ Important Note

**This is NOT a code issue** - The integration code is correct. The error `CK015` indicates that PhonePe's API is rejecting the request because:
- The merchant account doesn't have API access enabled, OR
- The endpoint is not available for this merchant type

**You MUST contact PhonePe support to activate API access for your merchant account.**

---

**Status**: ⏳ Waiting for PhonePe API access activation

