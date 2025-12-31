# Troubleshoot Cashfree 500 Error

## Current Status
- ✅ Route exists: `POST /api/payments/cashfree/create`
- ✅ Route is accessible (returns 401 without auth, not 404)
- ❌ Returns 500 when called with valid auth

## Most Likely Cause: Missing Cashfree Credentials

The 500 error is most likely because Cashfree credentials are not set in `.env`.

### Quick Fix

1. **Add to `ozme-backend/.env`:**
   ```env
   CASHFREE_CLIENT_ID=your_client_id
   CASHFREE_CLIENT_SECRET=your_client_secret
   CASHFREE_ENVIRONMENT=production
   CASHFREE_WEBHOOK_SECRET=your_webhook_secret
   ```

2. **Restart backend:**
   ```bash
   cd /var/www/ozme_production/OZME/ozme-backend
   pkill -9 -f "node.*server.js"
   sleep 2
   nohup node src/server.js > /tmp/ozme-backend.log 2>&1 &
   ```

3. **Check logs for detailed error:**
   ```bash
   tail -f /tmp/ozme-backend.log
   ```

## Check Backend Logs

The improved error logging will show:
- ✅ If order is found
- ✅ If Cashfree credentials are configured
- ❌ Exact error from Cashfree API

**View logs:**
```bash
tail -100 /tmp/ozme-backend.log | grep -A 10 "Cashfree"
```

## Expected Log Output (Success)

```
📥 Cashfree payment request received: { orderId: '...', amount: 799 }
✅ Order found: ORD-12345
📧 Customer info prepared: { name: '...', email: '...' }
🔄 Creating Cashfree payment session...
✅ Cashfree payment session created: { payment_session_id: '...' }
```

## Expected Log Output (Error - Missing Credentials)

```
📥 Cashfree payment request received: { orderId: '...', amount: 799 }
✅ Order found: ORD-12345
❌ Cashfree credentials not configured!
   CASHFREE_CLIENT_ID: ✗ Missing
   CASHFREE_CLIENT_SECRET: ✗ Missing
```

## Expected Log Output (Error - API Failure)

```
📥 Cashfree payment request received: { orderId: '...', amount: 799 }
✅ Order found: ORD-12345
🔄 Creating Cashfree payment session...
❌ Cashfree Authentication Failed!
💡 Check your Cashfree credentials in .env:
   CASHFREE_CLIENT_ID: ✓ Set
   CASHFREE_CLIENT_SECRET: ✓ Set
```

## Next Steps

1. Check backend logs to see the exact error
2. Add Cashfree credentials to `.env` if missing
3. Restart backend server
4. Test payment flow again

The improved error handling will now show clear messages in both console and user-facing toasts.

