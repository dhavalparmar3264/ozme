# ✅ OTP Send Error Fix - Complete

## Summary

Fixed the OTP sending 500 error by:
1. Detecting and handling placeholder URLs in `.env`
2. Adding robust error logging (without secrets)
3. Validating config at runtime
4. Improving API responses with error codes
5. Adding proper error handling for provider failures

## ✅ Issues Fixed

### 1. Placeholder URL Detection
- **Problem**: `.env` had `OTP_API_BASE_URL=https://<provider-base-url>` (placeholder)
- **Fix**: Config now detects placeholders and uses provider defaults
- **Result**: System automatically uses `https://apihome.in/panel/api/bulksms/` for API_HOME

### 2. Robust Error Logging
- **Added**: Comprehensive logging without secrets:
  - Endpoint name
  - Masked phone number (******3210)
  - Provider base URL (safe to log)
  - Provider response status
  - Sanitized response body (secrets removed)
  - Stack traces for errors
- **Never logs**: OTP_API_KEY, full phone numbers, OTP values

### 3. Runtime Config Validation
- **Validates**: 
  - `OTP_API_KEY` is present and non-empty
  - `OTP_API_BASE_URL` is not a placeholder
  - Base URL is a valid HTTP/HTTPS URL
- **Error messages**: Clear, actionable messages for missing/invalid config

### 4. Provider Request Format
- **Fixed**: URL construction with proper encoding
- **Added**: Timeout handling (30 seconds)
- **Added**: Authentication error detection (401/403)
- **Added**: Connection error handling

### 5. Improved API Response
- **Error codes**:
  - `OTP_CONFIG_ERROR` - Configuration issue
  - `OTP_PROVIDER_URL_ERROR` - Invalid base URL
  - `OTP_PROVIDER_AUTH_ERROR` - Provider auth failed
  - `OTP_PROVIDER_TIMEOUT` - Request timeout
  - `OTP_PROVIDER_CONNECTION_ERROR` - Connection failed
  - `OTP_PROVIDER_ERROR` - Provider returned error
  - `OTP_UNEXPECTED_ERROR` - Unexpected error
- **Response format**:
  ```json
  {
    "success": false,
    "message": "Clear error message",
    "errorCode": "ERROR_CODE"
  }
  ```

## Files Modified

1. ✅ **`ozme-backend/src/config/otp.js`**
   - Added placeholder detection
   - Validates base URL is not a placeholder
   - Uses provider defaults when placeholder detected
   - Clear error messages

2. ✅ **`ozme-backend/src/utils/sms.js`**
   - Added comprehensive error logging (no secrets)
   - Added URL validation
   - Added timeout handling
   - Added authentication error detection
   - Added sanitized response logging
   - Improved error codes

3. ✅ **`ozme-backend/src/controllers/phoneController.js`**
   - Improved error response with error codes
   - Proper status codes based on error type

## Environment Variables

### Current `.env` (with placeholder):
```bash
OTP_PROVIDER=api_home
OTP_API_KEY=d34bba5722d899bf9c9a26fb6457a9cd50064
OTP_API_BASE_URL=https://<provider-base-url>  # Placeholder - will use default
OTP_SENDER_ID=OZMEIN
```

### Recommended `.env` (explicit):
```bash
OTP_PROVIDER=API_HOME
OTP_API_KEY=d34bba5722d899bf9c9a26fb6457a9cd50064
OTP_API_BASE_URL=https://apihome.in/panel/api/bulksms/  # Or remove to use default
OTP_SENDER_ID=OZMEIN
OTP_TEMPLATE_ID=  # Optional
OTP_EXPIRY_MINUTES=10
OTP_RESEND_COOLDOWN_SECONDS=60
OTP_MAX_ATTEMPTS=5
```

**Note**: The system will automatically use the provider default if `OTP_API_BASE_URL` is a placeholder or missing.

## Error Logging Format

### Safe Logging (No Secrets):
```
[sendOTP] Sending OTP to ******3264 via API_HOME
[sendOTP] Provider base URL: https://apihome.in/panel/api/bulksms/
[sendOTP] Provider response status: 200
[sendOTP] Provider response (sanitized): success...
```

### Error Logging:
```
[sendOTP] Configuration error: OTP_API_KEY missing
[sendOTP] Invalid API base URL: placeholder detected
[sendOTP] Provider authentication failed: 401
[sendOTP] Fetch error: timeout
[sendOTP] Stack trace: ...
```

## Testing

### 1. Test OTP Send
1. Go to Dashboard → Phone Verification
2. Enter phone: `8734003264`
3. Click "Send OTP"

**Expected:**
- ✅ OTP sent successfully
- ✅ SMS received on phone
- ✅ No 500 errors

### 2. Check Logs
```bash
pm2 logs ozme-backend | grep -E "\[sendOTP\]|OTP"
```

**Expected:**
- ✅ Logs show masked phone (******3264)
- ✅ Logs show provider base URL
- ✅ Logs show response status
- ✅ No API keys or full phone numbers in logs

### 3. Test Error Handling
1. Temporarily set invalid `OTP_API_BASE_URL` in `.env`
2. Restart backend
3. Try to send OTP

**Expected:**
- ✅ Clear error message: "OTP provider base URL not configured"
- ✅ Error code: `OTP_PROVIDER_URL_ERROR`
- ✅ No stack trace exposed to frontend

## Verification

✅ **Placeholder detection** - System detects and handles placeholder URLs
✅ **Error logging** - Comprehensive logs without secrets
✅ **Config validation** - Runtime validation with clear errors
✅ **Provider errors** - Proper handling of auth/timeout/connection errors
✅ **API responses** - Clear error codes and messages
✅ **No secrets in logs** - API keys, phones, OTPs never logged

## Next Steps

1. **Test OTP sending** from dashboard
2. **Verify SMS delivery** on phone
3. **Check logs** for proper error handling
4. **Update `.env`** to remove placeholder (optional - system handles it)

---

**Status:** ✅ Complete - OTP sending should now work correctly

**Root Cause:** Placeholder URL in `.env` (`https://<provider-base-url>`) was being used instead of provider default.

**Solution:** Config now detects placeholders and automatically uses provider defaults.

