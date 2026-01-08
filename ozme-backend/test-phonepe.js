import 'dotenv/config';
import crypto from 'crypto';

// Test PhonePe API call
const testPhonePeAPI = async () => {
  const merchantId = process.env.PHONEPE_MERCHANT_ID;
  const clientId = process.env.PHONEPE_CLIENT_ID;
  const clientSecret = process.env.PHONEPE_CLIENT_SECRET;
  const clientVersion = process.env.PHONEPE_CLIENT_VERSION || '1';
  const environment = process.env.PHONEPE_ENV || 'PROD';

  console.log('🔍 PhonePe Configuration:');
  console.log({
    merchantId,
    clientId,
    hasClientSecret: !!clientSecret,
    clientVersion,
    environment,
  });

  const baseURL = environment === 'PROD'
    ? 'https://api.phonepe.com/apis/hermes'
    : 'https://api-testing.phonepe.com/apis/hermes';

  // Test payload
  const payload = {
    merchantId: merchantId,
    merchantTransactionId: `TEST_${Date.now()}`,
    merchantUserId: 'test_user',
    amount: 10000, // 100 INR in paise
    redirectUrl: 'https://ozme.in/test',
    redirectMode: 'REDIRECT',
    callbackUrl: 'https://ozme.in/api/payments/phonepe/callback',
    paymentInstrument: {
      type: 'PAY_PAGE',
    },
  };

  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
  const endpoint = '/pg/v1/pay';
  const stringToHash = base64Payload + endpoint + clientSecret;
  const sha256Hash = crypto.createHash('sha256').update(stringToHash).digest('hex');
  const xVerify = `${sha256Hash}###${clientVersion}`;

  const fullUrl = `${baseURL}${endpoint}`;

  console.log('\n📡 Making test API call:');
  console.log('URL:', fullUrl);
  console.log('Method: POST');
  console.log('Headers:', {
    'Content-Type': 'application/json',
    'X-VERIFY': xVerify.substring(0, 30) + '...',
    'X-CLIENT-ID': clientId,
  });

  try {
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': xVerify,
        'Accept': 'application/json',
        'X-CLIENT-ID': clientId,
      },
      body: JSON.stringify({
        request: base64Payload,
      }),
    });

    const responseText = await response.text();
    console.log('\n📥 Response Status:', response.status, response.statusText);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
    console.log('Response Body:', responseText.substring(0, 500));

    if (!response.ok) {
      console.error('\n❌ API Call Failed!');
      console.error('Status:', response.status);
      console.error('Response:', responseText);
    } else {
      console.log('\n✅ API Call Successful!');
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
};

testPhonePeAPI();

