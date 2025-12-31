# PhonePe UAT Payment Testing Guide

## ✅ Implementation Complete

### Files Created/Updated:

1. **`src/utils/phonepeUat.js`** - UAT payment utility with manual checksum
2. **`src/controllers/paymentController.js`** - Added `initiatePhonePeUatPayment` method
3. **`src/routes/paymentRoutes.js`** - Added route `POST /api/payments/phonepe/uat/initiate`

## 🔧 Configuration

UAT credentials from `.env`:
```env
PHONEPE_MODE=UAT
PHONEPE_UAT_MERCHANT_ID=PGTESTPAYUAT86
PHONEPE_UAT_SALT_KEY=96434309-7796-489d-8924-ab56988a6076
PHONEPE_UAT_SALT_INDEX=1
PHONEPE_UAT_PAY_URL=https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay
PHONEPE_UAT_RETURN_URL=https://ozme.in/checkout/success?order_id={order_id}
PHONEPE_UAT_CALLBACK_URL=https://www.ozme.in/api/payments/phonepe/webhook
```

## 🧪 Testing with cURL

### Step 1: Get Authentication Token

First, you need to login and get a JWT token:

```bash
# Login to get token
TOKEN=$(curl -s -X POST https://ozme.in/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your_email@example.com","password":"your_password"}' \
  | jq -r '.data.token')

echo "Token: $TOKEN"
```

### Step 2: Create a Test Order

Create an order first to get an orderId:

```bash
# Create order (replace with actual product IDs from your database)
ORDER_RESPONSE=$(curl -s -X POST https://ozme.in/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "items": [
      {
        "productId": "YOUR_PRODUCT_ID",
        "quantity": 1,
        "size": "100ml",
        "price": 799
      }
    ],
    "shippingAddress": {
      "name": "Test User",
      "phone": "9876543210",
      "email": "test@example.com",
      "address": "123 Test Street",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001",
      "country": "India"
    },
    "paymentMethod": "Prepaid",
    "totalAmount": 799
  }')

ORDER_ID=$(echo $ORDER_RESPONSE | jq -r '.data.order._id')
echo "Order ID: $ORDER_ID"
```

### Step 3: Test PhonePe UAT Payment

```bash
# Test PhonePe UAT payment initiation
curl -X POST https://ozme.in/api/payments/phonepe/uat/initiate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"orderId\":\"$ORDER_ID\"}" \
  | jq .
```

### Expected Response:

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

## 🧪 Complete Test Script

Save this as `test-phonepe-uat.sh`:

```bash
#!/bin/bash

# Configuration
API_BASE="https://ozme.in/api"
EMAIL="your_email@example.com"
PASSWORD="your_password"

echo "🔐 Step 1: Login..."
TOKEN=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  | jq -r '.data.token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Login failed. Please check credentials."
  exit 1
fi

echo "✅ Login successful"
echo ""

echo "📦 Step 2: Create test order..."
# Note: Replace PRODUCT_ID with actual product ID from your database
ORDER_RESPONSE=$(curl -s -X POST "$API_BASE/orders" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "items": [{"productId": "YOUR_PRODUCT_ID", "quantity": 1, "size": "100ml", "price": 799}],
    "shippingAddress": {
      "name": "Test User",
      "phone": "9876543210",
      "email": "test@example.com",
      "address": "123 Test Street",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001",
      "country": "India"
    },
    "paymentMethod": "Prepaid",
    "totalAmount": 799
  }')

ORDER_ID=$(echo $ORDER_RESPONSE | jq -r '.data.order._id')

if [ "$ORDER_ID" == "null" ] || [ -z "$ORDER_ID" ]; then
  echo "❌ Order creation failed"
  echo "Response: $ORDER_RESPONSE"
  exit 1
fi

echo "✅ Order created: $ORDER_ID"
echo ""

echo "💳 Step 3: Initiate PhonePe UAT payment..."
PAYMENT_RESPONSE=$(curl -s -X POST "$API_BASE/payments/phonepe/uat/initiate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"orderId\":\"$ORDER_ID\"}")

echo "$PAYMENT_RESPONSE" | jq .

REDIRECT_URL=$(echo $PAYMENT_RESPONSE | jq -r '.data.redirectUrl')

if [ "$REDIRECT_URL" != "null" ] && [ -n "$REDIRECT_URL" ]; then
  echo ""
  echo "✅ Payment link generated successfully!"
  echo "🔗 Redirect URL: $REDIRECT_URL"
  echo ""
  echo "Open this URL in your browser to test the payment flow."
else
  echo ""
  echo "❌ Failed to generate payment link"
  echo "Response: $PAYMENT_RESPONSE"
fi
```

## 🧪 Quick Test (Using Existing Order)

If you already have an order ID, you can test directly:

```bash
# Replace YOUR_TOKEN and YOUR_ORDER_ID
curl -X POST https://ozme.in/api/payments/phonepe/uat/initiate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"orderId":"YOUR_ORDER_ID"}' \
  | jq .
```

## 📋 Expected Response Format

**Success Response:**
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

**Error Response:**
```json
{
  "success": false,
  "message": "Error message here",
  "error": "Detailed error (in development mode)"
}
```

## ✅ Verification Checklist

- [ ] UAT credentials are set in `.env`
- [ ] Server is running and route is accessible
- [ ] Authentication token is valid
- [ ] Order exists in database
- [ ] Response contains `redirectUrl`
- [ ] Redirect URL is a valid PhonePe UAT payment page

## 🔗 API Endpoint

**POST** `/api/payments/phonepe/uat/initiate`

**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer <token>`

**Body:**
```json
{
  "orderId": "ORDER_ID"
}
```

**Response:**
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

---

**Status**: ✅ Ready for testing

