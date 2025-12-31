# PhonePe UAT Payment - cURL Test Command

## Quick Test Command

Replace `YOUR_TOKEN` and `YOUR_ORDER_ID` with actual values:

```bash
curl -X POST http://localhost:3002/api/payments/phonepe/uat/initiate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"orderId":"YOUR_ORDER_ID"}' \
  | jq .
```

## Complete Test Flow

### 1. Get Authentication Token

```bash
TOKEN=$(curl -s -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your_email@example.com","password":"your_password"}' \
  | jq -r '.data.token')

echo "Token: $TOKEN"
```

### 2. Test PhonePe UAT Payment (Replace ORDER_ID)

```bash
curl -X POST http://localhost:3002/api/payments/phonepe/uat/initiate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"orderId":"YOUR_ORDER_ID"}' \
  | jq .
```

## Expected Success Response

```json
{
  "success": true,
  "data": {
    "redirectUrl": "https://mercury-uat.phonepe.com/transact/pg?token=...",
    "merchantTransactionId": "OZME_UAT_ORDER_ID_TIMESTAMP",
    "orderId": "ORDER_ID",
    "amount": 799
  }
}
```

## Production URL (if testing on live server)

Replace `localhost:3002` with `https://ozme.in`:

```bash
curl -X POST https://ozme.in/api/payments/phonepe/uat/initiate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"orderId":"YOUR_ORDER_ID"}' \
  | jq .
```

## Verification

✅ **Success Criteria:**
- Response has `"success": true`
- `data.redirectUrl` exists and is a valid PhonePe UAT URL
- `data.merchantTransactionId` is generated
- No 404 or 500 errors

❌ **If you get errors:**
- Check server logs: `tail -f server.log`
- Verify UAT credentials in `.env`
- Ensure order exists in database
- Check authentication token is valid

