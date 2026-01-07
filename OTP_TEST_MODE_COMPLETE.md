# ✅ OTP Test Mode - Complete

## Summary

Added temporary testing mode for OTP that skips SMS sending and returns OTP in API response. This saves SMS costs during development/testing.

## ✅ Implementation

### 1. Environment Configuration
- ✅ **Added `OTP_TEST_MODE` env variable** to `.env`:
  ```env
  OTP_TEST_MODE=true
  ```
- ✅ **Config reads test mode** from environment
- ✅ **Startup logs show test mode** when enabled

### 2. OTP Config Updates
- ✅ **Added `testMode` to config object**
- ✅ **Startup warning** when test mode is enabled:
  ```
  ⚠️  TEST MODE: OTP will NOT be sent via SMS (OTP_TEST_MODE=true)
  ⚠️  OTP will be returned in API response for testing only
  ```
- ✅ **Health endpoint shows test mode** status

### 3. SMS Utility Updates
- ✅ **Test mode check** in `sendOTP()` function
- ✅ **Skips SMS provider call** when `testMode === true`
- ✅ **Returns OTP in response** for testing:
  ```json
  {
    "success": true,
    "message": "OTP generated successfully (TEST MODE - no SMS sent)",
    "data": {
      "testMode": true,
      "otp": "123456",
      "phone": "******3264",
      "message": "This OTP is only visible in test mode. In production, OTP is sent via SMS."
    }
  }
  ```
- ✅ **Safe logging**: Logs OTP with masked phone in test mode

### 4. Controller Updates
- ✅ **Returns OTP in response** when test mode is enabled
- ✅ **Includes test mode flag** in response data
- ✅ **Verification flow unchanged**: OTP verification works exactly the same

## ✅ Behavior

### Test Mode Enabled (`OTP_TEST_MODE=true`)
- ✅ OTP is generated normally
- ✅ OTP is **NOT sent via SMS provider**
- ✅ OTP is returned in API response (`data.otp`)
- ✅ OTP is logged in backend (with masked phone)
- ✅ Verification flow works exactly the same
- ✅ UI remains unchanged

### Production Mode (`OTP_TEST_MODE=false` or not set)
- ✅ OTP is generated normally
- ✅ OTP is sent via SMS provider
- ✅ OTP is **NOT** returned in API response
- ✅ Normal production behavior

## ✅ Files Modified

1. ✅ **`ozme-backend/src/config/otp.js`**
   - Added `testMode` to config
   - Added startup warning when test mode enabled
   - Added `testMode` to `getOTPConfigStatus()`

2. ✅ **`ozme-backend/src/utils/sms.js`**
   - Added test mode check before SMS sending
   - Returns OTP in response when test mode enabled
   - Safe logging of OTP in test mode

3. ✅ **`ozme-backend/src/controllers/phoneController.js`**
   - Includes OTP in response when test mode enabled
   - Adds test mode flag to response data

## ✅ Usage

### Enable Test Mode
Add to `.env`:
```env
OTP_TEST_MODE=true
```

Restart backend:
```bash
pm2 restart ozme-backend --update-env
```

### Test Mode Response
```json
{
  "success": true,
  "message": "OTP generated successfully (TEST MODE - no SMS sent)",
  "data": {
    "phone": "******3264",
    "expiresIn": 600,
    "expiresAt": "2026-01-04T18:00:00.000Z",
    "testMode": true,
    "otp": "123456",
    "message": "This OTP is only visible in test mode. In production, OTP is sent via SMS."
  }
}
```

### Disable Test Mode
Remove or set to false in `.env`:
```env
OTP_TEST_MODE=false
```

Restart backend:
```bash
pm2 restart ozme-backend --update-env
```

## ✅ Safety Features

✅ **Environment variable controlled** - Easy to enable/disable
✅ **Clear warnings** - Startup logs show test mode status
✅ **Safe logging** - OTP logged with masked phone only
✅ **Response flag** - `testMode: true` in response indicates test mode
✅ **No UI changes** - Frontend remains unchanged
✅ **Verification unchanged** - OTP verification works exactly the same

## ✅ Testing

### 1. Enable Test Mode
```bash
# Add to .env
OTP_TEST_MODE=true

# Restart backend
pm2 restart ozme-backend --update-env
```

### 2. Send OTP
```bash
curl -X POST http://localhost:3002/api/phone/send-otp \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"phone": "8734003264"}'
```

**Response:**
```json
{
  "success": true,
  "message": "OTP generated successfully (TEST MODE - no SMS sent)",
  "data": {
    "phone": "******3264",
    "expiresIn": 600,
    "expiresAt": "2026-01-04T18:00:00.000Z",
    "testMode": true,
    "otp": "123456"
  }
}
```

### 3. Verify OTP
Use the OTP from response:
```bash
curl -X POST http://localhost:3002/api/phone/verify-otp \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"phone": "8734003264", "otp": "123456"}'
```

### 4. Check Logs
```bash
pm2 logs ozme-backend | grep "TEST MODE"
```

**Expected:**
```
⚠️  TEST MODE: Skipping SMS send to ******3264
⚠️  TEST MODE: OTP for ******3264 is: 123456
```

## ✅ Important Notes

⚠️ **TEMPORARY ONLY** - This is for development/testing only
⚠️ **DISABLE IN PRODUCTION** - Set `OTP_TEST_MODE=false` before production
⚠️ **SECURITY** - OTP in response is only for testing, not for production
⚠️ **NO SMS COSTS** - Test mode saves SMS costs during development

## ✅ Disabling Test Mode

When ready for production:
1. Set `OTP_TEST_MODE=false` in `.env` (or remove it)
2. Restart backend: `pm2 restart ozme-backend --update-env`
3. Verify logs show: "OTP service ready for SMS sending" (no test mode warning)
4. Test OTP sending - should send real SMS

---

**Status:** ✅ Complete - OTP test mode is ready for development/testing

**Next Steps:**
1. Add `OTP_TEST_MODE=true` to `.env`
2. Restart backend
3. Test OTP flow - OTP will be in API response
4. Verify OTP works normally
5. **Remember to disable before production!**

