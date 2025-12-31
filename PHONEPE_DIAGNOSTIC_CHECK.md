# PhonePe Diagnostic Check

## Issue: Still Getting UAT URLs

Even after fixing the signature to use SALT_KEY, PhonePe is still returning UAT URLs:
- URL: `https://mercury-uat.phonepe.com/transact/simulator?token=...`

## Possible Causes

1. **SALT_KEY not set in .env** (Most Likely)
   - Check if `PHONEPE_SALT_KEY` is in `.env` file
   - Verify it matches PhonePe dashboard PROD credentials

2. **SALT_KEY incorrect**
   - SALT_KEY must match exactly what's in PhonePe dashboard
   - Check for extra spaces or quotes

3. **Merchant account not activated for PROD**
   - Contact PhonePe support to activate merchant account
   - Verify merchant ID `M23BLFR8IV7IN` is PROD (not UAT)

4. **Environment variables not loaded**
   - Server might not be loading `.env` file correctly
   - Check PM2/systemd is loading env vars

## Diagnostic Steps

### 1. Check Server Logs

Look for these log entries when payment is initiated:

```bash
tail -f /var/www/ozme_production/OZME/ozme-backend/server.log | grep -i phonepe
```

**Expected logs:**
```
🔐 X-VERIFY Signature Generated:
   endpoint: /pg/v1/pay
   saltKeyLength: XX  # Should be > 0
   saltIndex: 1
   signatureLength: XX

📤 PhonePe Request Details (Headers):
   configCheck: {
     hasSaltKey: true,  # Should be TRUE
     saltKeyLength: XX,  # Should be > 0
     saltIndex: 1
   }
```

**If you see:**
- `hasSaltKey: false` → SALT_KEY not loaded
- `saltKeyLength: 0` → SALT_KEY not set
- Error: "SALT_KEY is missing" → SALT_KEY not in .env

### 2. Check .env File

```bash
cd /var/www/ozme_production/OZME/ozme-backend
grep PHONEPE_SALT .env
```

**Should show:**
```
PHONEPE_SALT_KEY=your-salt-key-here
PHONEPE_SALT_INDEX=1
```

**If missing, add:**
```env
PHONEPE_SALT_KEY=your-salt-key-from-phonepe-dashboard
PHONEPE_SALT_INDEX=1
```

### 3. Verify Environment Variables Are Loaded

Check server startup logs:
```bash
tail -f /var/www/ozme_production/OZME/ozme-backend/server.log | grep "PhonePe Configuration"
```

**Should show:**
```
💳 PhonePe Configuration:
   SALT_KEY: ✓ Set (length: XX)  # Should show length
   SALT_INDEX: 1
```

**If shows:**
```
   SALT_KEY: ✗ NOT SET (REQUIRED for X-VERIFY signature)
```
→ SALT_KEY not in .env or not loaded

### 4. Restart Server with Environment Variables

```bash
cd /var/www/ozme_production/OZME/ozme-backend

# For PM2:
pm2 restart ozme-backend --update-env

# For systemd:
systemctl restart ozme-backend

# Verify env vars are loaded:
pm2 show ozme-backend | grep PHONEPE_SALT
# OR
systemctl show ozme-backend | grep PHONEPE_SALT
```

### 5. Test Payment and Check Logs

1. Go to checkout page
2. Click "Pay Securely"
3. Immediately check logs:

```bash
tail -f /var/www/ozme_production/OZME/ozme-backend/server.log | grep -E "(SALT_KEY|Signature|PhonePe)"
```

**Look for:**
- `hasSaltKey: true` → Good
- `saltKeyLength: XX` → Should be > 0
- `❌ CRITICAL: SALT_KEY is missing` → Bad, SALT_KEY not loaded

## Quick Fix Checklist

- [ ] `PHONEPE_SALT_KEY` is in `.env` file
- [ ] `PHONEPE_SALT_INDEX=1` is in `.env` file
- [ ] SALT_KEY matches PhonePe dashboard PROD credentials
- [ ] Server restarted after adding SALT_KEY
- [ ] Server logs show `SALT_KEY: ✓ Set (length: XX)`
- [ ] Payment logs show `hasSaltKey: true`

## If Still Getting UAT URLs After Adding SALT_KEY

1. **Verify SALT_KEY is correct:**
   - Log in to PhonePe Merchant Dashboard
   - Go to API Credentials → PROD
   - Copy SALT_KEY exactly (no extra spaces/quotes)
   - Update `.env` file

2. **Verify Merchant Account:**
   - Contact PhonePe support
   - Ask if merchant `M23BLFR8IV7IN` is activated for PROD
   - Verify account status

3. **Check Signature in Logs:**
   - Look for `🔐 X-VERIFY Signature Generated` log
   - Verify `saltKeyLength` matches your SALT_KEY length
   - Verify signature format is correct

4. **Test with PhonePe Support:**
   - Share signature generation logs with PhonePe
   - Ask them to verify signature is correct
   - Ask why PROD API is returning UAT URLs

## Contact Information

If issue persists after verifying SALT_KEY:
- PhonePe Support: support@phonepe.com
- PhonePe Developer Docs: https://developer.phonepe.com

