import 'dotenv/config';
import crypto from 'crypto';

/**
 * Test PhonePe Endpoint - Try different endpoint paths
 */

const testEndpoints = async () => {
  const merchantId = process.env.PHONEPE_MERCHANT_ID;
  const saltKey = process.env.PHONEPE_SALT_KEY;
  const saltIndex = process.env.PHONEPE_SALT_INDEX || '1';
  const baseURL = process.env.PHONEPE_BASE_URL || 'https://api.phonepe.com/apis/hermes';

  if (!merchantId || !saltKey) {
    console.error('❌ Missing required env vars');
    process.exit(1);
  }

  // Test payload
  const payload = {
    merchantId,
    merchantTransactionId: `TEST_${Date.now()}`,
    merchantUserId: 'test_user',
    amount: 10000, // 100 INR
    redirectUrl: 'https://ozme.in/test',
    redirectMode: 'REDIRECT',
    callbackUrl: 'https://www.ozme.in/api/payments/phonepe/callback',
    paymentInstrument: {
      type: 'PAY_PAGE',
    },
  };

  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');

  // Try different endpoint paths
  const endpoints = [
    '/pg/v1/pay',                    // Current
    '/apis/pg/v1/pay',              // Alternative 1
    '/apis/hermes/pg/v1/pay',       // Alternative 2
    '/hermes/pg/v1/pay',            // Alternative 3
  ];

  console.log('🧪 Testing PhonePe Endpoint Paths');
  console.log('='.repeat(60));
  console.log(`Base URL: ${baseURL}`);
  console.log(`Merchant ID: ${merchantId}`);
  console.log(`SALT_KEY length: ${saltKey.length}`);
  console.log(`SALT_INDEX: ${saltIndex}`);
  console.log('');

  for (const endpoint of endpoints) {
    const fullUrl = `${baseURL}${endpoint}`;
    
    // Generate signature
    const stringToHash = base64Payload + endpoint + saltKey;
    const sha256Hash = crypto.createHash('sha256').update(stringToHash).digest('hex');
    const signature = `${sha256Hash}###${saltIndex}`;

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-VERIFY': signature,
      'X-MERCHANT-ID': merchantId,
    };

    console.log(`Testing: ${fullUrl}`);
    console.log(`  Endpoint: ${endpoint}`);
    console.log(`  Signature prefix: ${signature.substring(0, 30)}...`);

    try {
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ request: base64Payload }),
      });

      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = { raw: responseText };
      }

      console.log(`  Status: ${response.status} ${response.statusText}`);
      
      if (response.status === 404) {
        console.log(`  ❌ 404 - Endpoint not found`);
      } else if (response.status === 401 || response.status === 403) {
        console.log(`  ⚠️  ${response.status} - Authentication issue (signature might be wrong)`);
        console.log(`  Response: ${responseText.substring(0, 200)}`);
      } else if (response.status === 200 || response.status === 201) {
        console.log(`  ✅ ${response.status} - SUCCESS!`);
        console.log(`  Response: ${responseText.substring(0, 300)}`);
        console.log(`\n🎉 CORRECT ENDPOINT FOUND: ${endpoint}`);
        break;
      } else {
        console.log(`  Response: ${responseText.substring(0, 200)}`);
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
    
    console.log('');
  }

  console.log('='.repeat(60));
  console.log('Test complete. Check which endpoint returned 200/201 status.');
};

testEndpoints().catch(console.error);

