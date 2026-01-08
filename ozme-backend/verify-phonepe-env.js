import 'dotenv/config';

/**
 * Verify PhonePe Environment Configuration
 * This script checks if all required PhonePe PROD credentials are set correctly
 */

console.log('🔍 PhonePe Environment Configuration Check');
console.log('='.repeat(60));

const checks = {
    'PHONEPE_MODE': {
        value: process.env.PHONEPE_MODE,
        required: true,
        expected: 'PROD',
        status: process.env.PHONEPE_MODE === 'PROD' ? '✅' : '❌',
    },
    'PHONEPE_MERCHANT_ID': {
        value: process.env.PHONEPE_MERCHANT_ID,
        required: true,
        expected: 'M23BLFR8IV7IN (PROD merchant ID)',
        status: process.env.PHONEPE_MERCHANT_ID ? '✅' : '❌',
        isUat: process.env.PHONEPE_MERCHANT_ID?.includes('PGTEST') || process.env.PHONEPE_MERCHANT_ID?.includes('UAT'),
    },
    'PHONEPE_SALT_KEY': {
        value: process.env.PHONEPE_SALT_KEY,
        required: true,
        expected: 'Salt key from PhonePe dashboard (usually UUID format)',
        status: process.env.PHONEPE_SALT_KEY ? '✅' : '❌',
        length: process.env.PHONEPE_SALT_KEY?.length || 0,
        preview: process.env.PHONEPE_SALT_KEY ? process.env.PHONEPE_SALT_KEY.substring(0, 20) + '...' : 'NOT SET',
    },
    'PHONEPE_SALT_INDEX': {
        value: process.env.PHONEPE_SALT_INDEX,
        required: true,
        expected: '1 (usually)',
        status: process.env.PHONEPE_SALT_INDEX ? '✅' : '❌',
    },
    'PHONEPE_BASE_URL': {
        value: process.env.PHONEPE_BASE_URL,
        required: false,
        expected: 'https://api.phonepe.com/apis/hermes',
        status: (process.env.PHONEPE_BASE_URL || 'https://api.phonepe.com/apis/hermes').includes('api.phonepe.com') ? '✅' : '❌',
        isUat: (process.env.PHONEPE_BASE_URL || '').includes('preprod') || (process.env.PHONEPE_BASE_URL || '').includes('sandbox'),
    },
    'PHONEPE_CLIENT_SECRET': {
        value: process.env.PHONEPE_CLIENT_SECRET,
        required: false,
        preview: process.env.PHONEPE_CLIENT_SECRET ? process.env.PHONEPE_CLIENT_SECRET.substring(0, 20) + '...' : 'NOT SET',
    },
};

console.log('\n📋 Configuration Status:\n');

let hasErrors = false;

for (const [key, check] of Object.entries(checks)) {
    if (key === 'PHONEPE_CLIENT_SECRET') {
        // Skip CLIENT_SECRET from main check
        continue;
    }
    
    console.log(`${check.status} ${key}:`);
    
    if (check.value) {
        if (key === 'PHONEPE_SALT_KEY') {
            console.log(`   Value: ${check.preview} (length: ${check.length})`);
            
            // Check if SALT_KEY looks like CLIENT_SECRET
            if (check.value === process.env.PHONEPE_CLIENT_SECRET) {
                console.log(`   ⚠️  WARNING: SALT_KEY matches CLIENT_SECRET!`);
                console.log(`   This is likely incorrect. SALT_KEY should be different from CLIENT_SECRET.`);
                console.log(`   Get SALT_KEY from PhonePe dashboard → Settings → API Credentials → PROD`);
                hasErrors = true;
            }
        } else if (key === 'PHONEPE_MERCHANT_ID') {
            console.log(`   Value: ${check.value}`);
            if (check.isUat) {
                console.log(`   ⚠️  WARNING: Merchant ID appears to be UAT/test ID!`);
                console.log(`   UAT merchant IDs start with PGTEST or contain UAT`);
                hasErrors = true;
            }
        } else if (key === 'PHONEPE_BASE_URL') {
            const url = check.value || check.expected;
            console.log(`   Value: ${url}`);
            if (check.isUat) {
                console.log(`   ⚠️  WARNING: Base URL contains UAT/sandbox indicators!`);
                hasErrors = true;
            }
        } else {
            console.log(`   Value: ${check.value}`);
        }
    } else {
        console.log(`   Value: NOT SET`);
        if (check.required) {
            console.log(`   ❌ REQUIRED but missing!`);
            hasErrors = true;
        }
    }
    
    console.log(`   Expected: ${check.expected}`);
    console.log('');
}

// Check if SALT_KEY matches CLIENT_SECRET
if (process.env.PHONEPE_SALT_KEY && process.env.PHONEPE_CLIENT_SECRET) {
    if (process.env.PHONEPE_SALT_KEY === process.env.PHONEPE_CLIENT_SECRET) {
        console.log('❌ CRITICAL ISSUE DETECTED:');
        console.log('   PHONEPE_SALT_KEY matches PHONEPE_CLIENT_SECRET!');
        console.log('   This is incorrect. They should be different values.');
        console.log('');
        console.log('📝 How to Fix:');
        console.log('   1. Log in to PhonePe Merchant Dashboard: https://merchant.phonepe.com/');
        console.log('   2. Go to Settings → API Credentials');
        console.log('   3. Select PROD environment (not UAT)');
        console.log('   4. Copy the "Salt Key" value (usually a UUID)');
        console.log('   5. Update .env file:');
        console.log('      PHONEPE_SALT_KEY=<paste-salt-key-from-dashboard>');
        console.log('   6. Restart backend: pm2 restart ozme-backend --update-env');
        console.log('');
        hasErrors = true;
    }
}

console.log('='.repeat(60));

if (hasErrors) {
    console.log('❌ Configuration has errors. Please fix them before proceeding.');
    console.log('');
    console.log('📝 Next Steps:');
    console.log('   1. Update .env file with correct values from PhonePe dashboard');
    console.log('   2. Restart backend: pm2 restart ozme-backend --update-env');
    console.log('   3. Run this script again to verify');
    process.exit(1);
} else {
    console.log('✅ All required configuration is set correctly!');
    console.log('');
    console.log('📝 Next Steps:');
    console.log('   1. Restart backend to load new env vars:');
    console.log('      pm2 restart ozme-backend --update-env');
    console.log('   2. Test payment flow');
    console.log('   3. Check server logs for PhonePe configuration');
}

