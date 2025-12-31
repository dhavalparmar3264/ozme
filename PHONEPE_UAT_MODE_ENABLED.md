# PhonePe UAT Mode - Auto-Switch Enabled ✅

## ✅ Update Complete

The `/api/payments/phonepe/create` endpoint now automatically uses **UAT mode** when `PHONEPE_MODE=UAT` is set in `.env`.

### How It Works

1. **Check Mode**: When a payment request comes to `/api/payments/phonepe/create`, the system checks `PHONEPE_MODE`
2. **UAT Mode**: If `PHONEPE_MODE=UAT`, it uses:
   - `PHONEPE_UAT_MERCHANT_ID`
   - `PHONEPE_UAT_SALT_KEY`
   - `PHONEPE_UAT_SALT_INDEX`
   - `PHONEPE_UAT_PAY_URL`
3. **PROD Mode**: If `PHONEPE_MODE` is not set or set to `PROD`, it uses SDK credentials

### Current Configuration

Your `.env` has:
```env
PHONEPE_MODE=UAT
PHONEPE_UAT_MERCHANT_ID=PGTESTPAYUAT86
PHONEPE_UAT_SALT_KEY=96434309-7796-489d-8924-ab56988a6076
PHONEPE_UAT_SALT_INDEX=1
PHONEPE_UAT_PAY_URL=https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay
```

### ✅ Result

- **Frontend**: No changes needed - still calls `/api/payments/phonepe/create`
- **Backend**: Automatically uses UAT credentials when `PHONEPE_MODE=UAT`
- **Testing**: You can now test payments with UAT credentials
- **Production**: When ready, change `PHONEPE_MODE=PROD` to use production credentials

### 🧪 Testing

Try the payment flow again:
1. Go to https://ozme.in/checkout
2. Fill shipping details
3. Select "Online Payment via PhonePe"
4. Click "Pay Securely"
5. Should now redirect to PhonePe UAT payment page (not 404 error)

### 📋 Server Logs

When UAT mode is active, you'll see:
```
🧪 Using PhonePe UAT mode for testing
🔄 Creating PhonePe UAT payment...
✅ PhonePe UAT payment created: { ... }
```

### 🔄 Switching to Production

When you're ready for production:
1. Set `PHONEPE_MODE=PROD` in `.env`
2. Ensure PROD credentials are configured
3. Restart server
4. Payments will use PROD API

---

**Status**: ✅ UAT mode enabled - Ready for testing

