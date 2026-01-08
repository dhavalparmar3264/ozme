#!/bin/bash
# PhonePe UAT Payment Test Script
# Usage: ./test-phonepe-uat-curl.sh YOUR_EMAIL YOUR_PASSWORD ORDER_ID

API_BASE="http://localhost:3002/api"
EMAIL="${1:-test@example.com}"
PASSWORD="${2:-password123}"
ORDER_ID="${3}"

echo "🔐 Step 1: Login..."
TOKEN=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  | jq -r '.data.token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Login failed"
  exit 1
fi

echo "✅ Token obtained"
echo ""

if [ -z "$ORDER_ID" ]; then
  echo "📦 Step 2: Creating test order..."
  # You need to provide a valid product ID
  echo "⚠️  Please provide ORDER_ID as third argument"
  echo "Usage: $0 EMAIL PASSWORD ORDER_ID"
  exit 1
fi

echo "💳 Step 3: Testing PhonePe UAT payment for order: $ORDER_ID"
echo ""
curl -X POST "$API_BASE/payments/phonepe/uat/initiate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"orderId\":\"$ORDER_ID\"}" \
  | jq .

echo ""
echo "✅ Test complete"
