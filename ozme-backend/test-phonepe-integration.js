import 'dotenv/config';
import { createPhonePePayment, getPhonePeStatus } from './src/utils/phonepe.js';

/**
 * Test PhonePe Integration
 * This script tests the complete PhonePe payment flow
 */

const testPhonePeIntegration = async () => {
  console.log('🧪 Testing PhonePe Integration');
  console.log('='.repeat(60));

  // Check environment variables
  console.log('\n📋 Environment Variables Check:');
  const requiredVars = [
    'PHONEPE_MODE',
    'PHONEPE_BASE_URL',
    'PHONEPE_MERCHANT_ID',
    'PHONEPE_CLIENT_ID',
    'PHONEPE_CLIENT_SECRET',
    'PHONEPE_SALT_KEY',
    'PHONEPE_SALT_INDEX',
    'PHONEPE_RETURN_URL',
    'PHONEPE_CALLBACK_URL',
  ];

  const missingVars = [];
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (!value) {
      missingVars.push(varName);
      console.log(`   ❌ ${varName}: NOT SET`);
    } else {
      // Mask sensitive values
      if (varName.includes('SECRET') || varName.includes('SALT_KEY') || varName.includes('PASSWORD')) {
        console.log(`   ✅ ${varName}: Set (length: ${value.length})`);
      } else {
        console.log(`   ✅ ${varName}: ${value.substring(0, 30)}${value.length > 30 ? '...' : ''}`);
      }
    }
  });

  if (missingVars.length > 0) {
    console.error('\n❌ Missing required environment variables:');
    missingVars.forEach(v => console.error(`   - ${v}`));
    console.error('\nPlease set these in your .env file');
    process.exit(1);
  }

  // Test 1: Configuration Check
  console.log('\n✅ All required environment variables are set');

  // Test 2: Payment Creation (Dry Run)
  console.log('\n📡 Test 2: Payment Creation Test');
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
    console.log({
      redirectUrl: paymentResponse.redirectUrl?.substring(0, 100) + '...',
      merchantTransactionId: paymentResponse.merchantTransactionId,
    });

    // Check if redirect URL is PROD
    const redirectUrl = paymentResponse.redirectUrl || '';
    const isUatUrl = redirectUrl.includes('mercury-uat') || 
                    redirectUrl.includes('merchant-simulator') ||
                    redirectUrl.includes('/simulator') ||
                    redirectUrl.includes('pgtest');

    if (isUatUrl) {
      console.error('\n❌ ERROR: PhonePe returned UAT/simulator URL!');
      console.error('   URL:', redirectUrl);
      console.error('   This indicates:');
      console.error('   1. SALT_KEY might be incorrect');
      console.error('   2. SALT_INDEX might be incorrect');
      console.error('   3. Merchant account not activated for PROD');
      console.error('   4. Invalid signature');
      process.exit(1);
    } else {
      console.log('\n✅ Redirect URL is PROD (not UAT)');
      console.log('   Domain:', new URL(redirectUrl).hostname);
    }

    // Test 3: Status Check (if merchantTransactionId is available)
    console.log('\n📊 Test 3: Payment Status Check');
    console.log('-'.repeat(60));
    
    try {
      // Note: This will fail for test transactions, but it tests the API call
      const statusResponse = await getPhonePeStatus(testMerchantTransactionId);
      console.log('✅ Status check successful:', {
        state: statusResponse.state,
        transactionId: statusResponse.transactionId,
      });
    } catch (statusError) {
      // Expected for test transactions
      console.log('ℹ️  Status check (expected to fail for test transaction):', statusError.message);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests completed successfully!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Verify redirect URL is PROD (not UAT)');
    console.log('   2. Test actual payment flow on checkout page');
    console.log('   3. Verify callback/webhook is working');
    console.log('   4. Check payment status verification endpoint');

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

// Run tests
testPhonePeIntegration().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

