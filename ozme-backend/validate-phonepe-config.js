import 'dotenv/config';

/**
 * Validate PhonePe Pay Page Integration Configuration
 * Ensures all required environment variables are set correctly
 */

console.log('🔍 PhonePe Pay Page Integration - Configuration Validation');
console.log('='.repeat(70));

const validationResults = {
  passed: [],
  failed: [],
  warnings: [],
};

// Required variables
const requiredVars = {
  'PHONEPE_MODE': {
    value: process.env.PHONEPE_MODE,
    expected: 'PROD',
    required: true,
  },
  'PHONEPE_MERCHANT_ID': {
    value: process.env.PHONEPE_MERCHANT_ID,
    expected: 'M23BLFR8IV7IN',
    required: true,
  },
  'PHONEPE_SALT_KEY': {
    value: process.env.PHONEPE_SALT_KEY,
    expected: 'UUID format from PhonePe dashboard',
    required: true,
  },
  'PHONEPE_SALT_INDEX': {
    value: process.env.PHONEPE_SALT_INDEX,
    expected: '1',
    required: true,
  },
  'PHONEPE_BASE_URL': {
    value: process.env.PHONEPE_BASE_URL,
    expected: 'https://api.phonepe.com/apis/hermes',
    required: false,
  },
};

// Validate each variable
for (const [key, config] of Object.entries(requiredVars)) {
  const hasValue = !!config.value;
  const isValid = config.required ? hasValue : true;
  
  if (key === 'PHONEPE_MODE') {
    const isProd = config.value === 'PROD';
    if (!hasValue || !isProd) {
      validationResults.failed.push(`${key}: ${config.value || 'NOT SET'} (must be PROD)`);
    } else {
      validationResults.passed.push(`${key}: ${config.value}`);
    }
  } else if (key === 'PHONEPE_SALT_KEY') {
    if (!hasValue) {
      validationResults.failed.push(`${key}: NOT SET (REQUIRED)`);
    } else {
      const length = config.value.length;
      const isValidFormat = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(config.value);
      if (isValidFormat) {
        validationResults.passed.push(`${key}: ✓ Set (length: ${length}, valid UUID format)`);
      } else {
        validationResults.warnings.push(`${key}: Set (length: ${length}) but format may be incorrect - verify it matches PhonePe dashboard`);
      }
    }
  } else if (key === 'PHONEPE_SALT_INDEX') {
    if (!hasValue) {
      validationResults.warnings.push(`${key}: NOT SET (will default to "1")`);
    } else if (config.value === '1') {
      validationResults.passed.push(`${key}: ${config.value}`);
    } else {
      validationResults.warnings.push(`${key}: ${config.value} (usually should be "1")`);
    }
  } else if (key === 'PHONEPE_BASE_URL') {
    if (!hasValue) {
      validationResults.warnings.push(`${key}: NOT SET (will use default: https://api.phonepe.com/apis/hermes)`);
    } else if (config.value === config.expected) {
      validationResults.passed.push(`${key}: ${config.value}`);
    } else if (config.value.includes('preprod') || config.value.includes('sandbox') || config.value.includes('uat')) {
      validationResults.failed.push(`${key}: ${config.value} (contains UAT/sandbox indicators)`);
    } else {
      validationResults.warnings.push(`${key}: ${config.value} (expected: ${config.expected})`);
    }
  } else {
    if (!hasValue && config.required) {
      validationResults.failed.push(`${key}: NOT SET (REQUIRED)`);
    } else if (hasValue) {
      const displayValue = key.includes('KEY') || key.includes('SECRET') 
        ? `${config.value.substring(0, 10)}... (length: ${config.value.length})`
        : config.value;
      validationResults.passed.push(`${key}: ${displayValue}`);
    }
  }
}

// Check for CLIENT_SECRET (should NOT be used for Pay Page)
const hasClientSecret = !!process.env.PHONEPE_CLIENT_SECRET;
if (hasClientSecret) {
  validationResults.warnings.push('PHONEPE_CLIENT_SECRET: Set but NOT used for Pay Page integration (only SALT_KEY is used)');
}

// Print results
console.log('\n✅ Passed:');
validationResults.passed.forEach(item => console.log(`   ${item}`));

if (validationResults.warnings.length > 0) {
  console.log('\n⚠️  Warnings:');
  validationResults.warnings.forEach(item => console.log(`   ${item}`));
}

if (validationResults.failed.length > 0) {
  console.log('\n❌ Failed:');
  validationResults.failed.forEach(item => console.log(`   ${item}`));
}

console.log('\n' + '='.repeat(70));

// Final validation
const hasFailures = validationResults.failed.length > 0;
const hasCriticalWarnings = validationResults.warnings.some(w => w.includes('SALT_KEY') && w.includes('format'));

if (hasFailures) {
  console.log('❌ Configuration validation FAILED');
  console.log('   Please fix the failed items above before proceeding.');
  process.exit(1);
} else if (hasCriticalWarnings) {
  console.log('⚠️  Configuration validation PASSED with warnings');
  console.log('   Please verify SALT_KEY matches PhonePe dashboard PROD credentials.');
  console.log('   If SALT_KEY is incorrect, PhonePe will return 404 errors.');
  process.exit(0);
} else {
  console.log('✅ Configuration validation PASSED');
  console.log('   All required variables are set correctly.');
  console.log('   Ready for production use.');
  process.exit(0);
}

