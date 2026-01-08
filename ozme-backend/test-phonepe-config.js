import 'dotenv/config';
import { createPhonePePayment } from './src/utils/phonepe.js';

/**
 * Test PhonePe Configuration
 * Prints configuration details and tests payment creation
 */

const testPhonePeConfig = async () => {
  console.log('🧪 PhonePe Configuration Test');
  console.log('='.repeat(60));

  // Check SALT_KEY
  const saltKey = process.env.PHONEPE_SALT_KEY;
  const saltIndex = process.env.PHONEPE_SALT_INDEX || '1';
  const merchantId = process.env.PHONEPE_MERCHANT_ID;
  const baseURL = process.env.PHONEPE_BASE_URL || 'https://api.phonepe.com/apis/hermes';

  console.log('\n📋 Configuration Check:');
  console.log(`   SALT_KEY: ${saltKey ? `✓ Set (length: ${saltKey.length})` : '✗ NOT SET (REQUIRED)'}`);
  console.log(`   SALT_INDEX: ${saltIndex}`);
  console.log(`   MERCHANT_ID: ${merchantId ? merchantId.substring(0, 10) + '...' : '✗ NOT SET'}`);
  console.log(`   BASE_URL: ${baseURL}`);

  if (!saltKey) {
    console.error('\n❌ ERROR: PHONEPE_SALT_KEY is REQUIRED but not set!');
    console.error('   Payment initiation will fail without SALT_KEY.');
    console.error('   Please set PHONEPE_SALT_KEY in your .env file.');
    process.exit(1);
  }

  if (!merchantId) {
    console.error('\n❌ ERROR: PHONEPE_MERCHANT_ID is REQUIRED but not set!');
    process.exit(1);
  }

  // Test payment creation
  console.log('\n📡 Testing Payment Creation:');
  console.log('-'.repeat(60));

  try {
    const testMerchantTransactionId = `TEST_${Date.now()}`;
    const testAmount = 10000; // 100 INR in paise

    console.log('Creating test payment...');
    console.log({
      merchantTransactionId: testMerchantTransactionId,
      amountPaise: testAmount,
      amountINR: testAmount / 100,
    });

    const paymentResponse = await createPhonePePayment({
      merchantTransactionId: testMerchantTransactionId,
      amountPaise: testAmount,
      userId: 'test_user',
      mobileNumber: '9999999999',
      redirectUrl: process.env.PHONEPE_RETURN_URL?.replace('{order_id}', 'test_order') || 'https://ozme.in/test',
      callbackUrl: process.env.PHONEPE_CALLBACK_URL || 'https://www.ozme.in/api/payments/phonepe/callback',
    });

    console.log('\n✅ Payment Creation Successful!');

    // Extract redirect URL and domain
    const redirectUrl = paymentResponse.redirectUrl || '';
    const endpointUrl = `${baseURL}/pg/v1/pay`;

    let redirectDomain = 'unknown';
    try {
      const urlObj = new URL(redirectUrl);
      redirectDomain = urlObj.hostname;
    } catch (e) {
      console.error('Failed to parse redirect URL');
    }

    console.log('\n📊 Results:');
    console.log('='.repeat(60));
    console.log(`   Endpoint URL Called: ${endpointUrl}`);
    console.log(`   Redirect URL: ${redirectUrl.substring(0, 100)}${redirectUrl.length > 100 ? '...' : ''}`);
    console.log(`   Redirect Domain: ${redirectDomain}`);

    // Check if UAT/simulator
    const isUatDomain = redirectDomain.includes('mercury-uat') ||
                       redirectDomain.includes('merchant-simulator') ||
                       redirectDomain.includes('pgtest') ||
                       redirectUrl.includes('/simulator');

    if (isUatDomain) {
      console.error('\n❌ ERROR: PhonePe returned UAT/simulator URL!');
      console.error(`   Domain: ${redirectDomain}`);
      console.error('\n   Possible Causes:');
      console.error('   1. SALT_KEY mismatch with PhonePe dashboard');
      console.error('   2. SALT_INDEX mismatch with PhonePe dashboard');
      console.error('   3. Merchant account not activated for PROD');
      console.error('   4. Invalid signature format');
      console.error('\n   Action Required:');
      console.error('   - Verify PHONEPE_SALT_KEY matches PhonePe dashboard PROD credentials');
      console.error('   - Verify PHONEPE_SALT_INDEX matches PhonePe dashboard (usually "1")');
      console.error('   - Contact PhonePe support if credentials are correct');
      process.exit(1);
    } else {
      console.log('\n✅ Redirect Domain is PROD (not UAT/simulator)');
      console.log(`   Domain: ${redirectDomain}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Configuration test passed!');
    console.log('\n📝 Summary:');
    console.log(`   - SALT_KEY: ✓ Set (length: ${saltKey.length})`);
    console.log(`   - SALT_INDEX: ${saltIndex}`);
    console.log(`   - Endpoint: ${endpointUrl}`);
    console.log(`   - Redirect Domain: ${redirectDomain} (PROD)`);

  } catch (error) {
    console.error('\n❌ Payment Creation Failed:');
    console.error('   Error:', error.message);
    console.error('\n📋 Troubleshooting:');
    
    if (error.message.includes('SALT_KEY')) {
      console.error('   - Verify PHONEPE_SALT_KEY is set correctly in .env');
      console.error('   - Check SALT_KEY matches PhonePe dashboard PROD credentials');
    } else if (error.message.includes('not configured')) {
      console.error('   - Verify all required environment variables are set');
      console.error('   - Check .env file is loaded correctly');
    } else if (error.message.includes('UAT') || error.message.includes('simulator')) {
      console.error('   - PhonePe returned UAT URL - check credentials');
      console.error('   - Verify merchant account is activated for PROD');
    } else {
      console.error('   - Check server logs for detailed error');
      console.error('   - Verify PhonePe API is accessible');
    }
    
    process.exit(1);
  }
};

// Run test
testPhonePeConfig().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

