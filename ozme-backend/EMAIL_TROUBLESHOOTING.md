# Email Troubleshooting Guide

## Current Issue: SMTP Authentication Failing

The email system is configured but **SMTP authentication is failing** with error:
```
535 5.7.8 Error: authentication failed
```

## What's Working ✅

1. ✅ Email code is properly integrated into order creation
2. ✅ Admin notification emails are attempted for ALL orders
3. ✅ Customer confirmation emails are attempted for COD orders
4. ✅ Email failures do NOT block order creation
5. ✅ Detailed logging is enabled

## What's NOT Working ❌

- ❌ SMTP authentication with Titan Email is failing
- ❌ No emails are being sent (authentication blocks all sends)

## Root Cause

The SMTP credentials (`EMAIL_USER` and `EMAIL_PASSWORD`) are not authenticating successfully with Titan Email's SMTP server.

## Troubleshooting Steps

### 1. Verify SMTP Credentials

Check your `.env` file:
```bash
EMAIL_HOST=smtp.titan.email
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=notify@ozme.in
EMAIL_PASSWORD=@Ozme@Updates@0911
ADMIN_NOTIFY_EMAIL=elliegoulding7717@gmail.com
```

### 2. Test SMTP Connection

Run the test endpoint:
```bash
curl "http://localhost:3002/api/email/test?to=elliegoulding7717@gmail.com"
```

### 3. Common Issues & Solutions

#### Issue A: Password Contains Special Characters
**Problem**: Password starts with `@` which might need quoting in `.env`

**Solution**: Try wrapping password in quotes:
```env
EMAIL_PASSWORD="@Ozme@Updates@0911"
```

#### Issue B: SMTP Access Not Enabled
**Problem**: Titan Email account doesn't have SMTP access enabled

**Solution**: 
1. Log into Titan Email webmail
2. Go to Settings → Email → SMTP Settings
3. Enable SMTP access
4. Generate/verify SMTP password

#### Issue C: Wrong Password Type
**Problem**: Using regular password instead of SMTP/app password

**Solution**: 
- If 2FA is enabled, you need an app-specific password
- Generate SMTP password from Titan Email settings
- Use that password in `EMAIL_PASSWORD`

#### Issue D: Account Locked or Suspended
**Problem**: Account might be locked due to failed login attempts

**Solution**: 
- Check Titan Email account status
- Reset password if needed
- Wait a few minutes and try again

### 4. Verify Email Configuration

Check server logs on startup - you should see:
```
🔍 Verifying SMTP connection...
   Host: smtp.titan.email
   Port: 587
   User: notify@ozme.in
   Password length: 18
```

If verification fails, you'll see:
```
❌ SMTP connection verification FAILED:
   Error Code: EAUTH
   Response Code: 535
   Error Message: Invalid login: 535 5.7.8 Error: authentication failed
```

### 5. Test After Fixing

After updating credentials:
1. Restart the server: `pkill -f "node src/server.js" && node src/server.js`
2. Check startup logs for SMTP verification
3. Test with: `curl "http://localhost:3002/api/email/test?to=elliegoulding7717@gmail.com"`
4. Place a test order and check logs for email attempts

## Current Status

- **Email Code**: ✅ Working (attempts to send on every order)
- **SMTP Auth**: ❌ Failing (needs credential fix)
- **Order Creation**: ✅ Working (emails don't block orders)

## Next Steps

1. **Fix SMTP credentials** - Verify password with Titan Email
2. **Test connection** - Use `/api/email/test` endpoint
3. **Verify in logs** - Check for "✅ SMTP connection verified successfully"
4. **Test order** - Place an order and verify emails are sent

## Log Locations

- Server logs: `/tmp/ozme-backend.log`
- Look for: `📤 Sending admin order notification...`
- Look for: `✅ Admin notification email sent successfully...` or `❌ Admin notification email failed...`

