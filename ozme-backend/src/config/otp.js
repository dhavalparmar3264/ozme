import 'dotenv/config'; // Load environment variables first

/**
 * Centralized OTP Configuration
 * 
 * Reads credentials and settings from environment variables:
 * - OTP_PROVIDER (optional, default: 'API_HOME')
 * - OTP_API_KEY (required)
 * - OTP_API_BASE_URL (optional, default based on provider)
 * - OTP_SENDER_ID (optional)
 * - OTP_TEMPLATE_ID (optional)
 * - OTP_EXPIRY_MINUTES (optional, default: 10)
 * - OTP_RESEND_COOLDOWN_SECONDS (optional, default: 60)
 * - OTP_MAX_ATTEMPTS (optional, default: 5)
 * 
 * Throws clear error if required variables are missing (fail fast)
 * Exports OTP configuration for reuse
 */

let isConfigured = false;
let otpConfig = null;

// Provider-specific defaults
const PROVIDER_DEFAULTS = {
  API_HOME: {
    baseUrl: 'https://apihome.in/panel/api/bulksms/',
    requiresBaseUrl: false,
  },
  // Add other providers here as needed
};

/**
 * Configure OTP service with environment variables
 * Called automatically on module import (fail fast)
 */
const configureOTP = () => {
  if (isConfigured && otpConfig) {
    return otpConfig;
  }

  const provider = (process.env.OTP_PROVIDER || 'API_HOME').toUpperCase();
  const apiKey = process.env.OTP_API_KEY;
  const apiBaseUrl = process.env.OTP_API_BASE_URL;
  const senderId = process.env.OTP_SENDER_ID;
  const templateId = process.env.OTP_TEMPLATE_ID;
  const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10);
  const resendCooldownSeconds = parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS || '60', 10);
  const maxAttempts = parseInt(process.env.OTP_MAX_ATTEMPTS || '5', 10);
  const testMode = process.env.OTP_TEST_MODE === 'true' || process.env.OTP_TEST_MODE === '1';

  // Fail fast - throw clear error if required variable is missing
  if (!apiKey) {
    const errorMsg = `OTP configuration failed: Missing required environment variable: OTP_API_KEY. Please set this in your .env file and restart the server.`;
    console.error('❌ OTP Configuration Error:');
    console.error('   Missing: OTP_API_KEY');
    console.error('💡 Please check your .env file and ensure OTP_API_KEY is set.');
    throw new Error(errorMsg);
  }

  // Validate API key format (basic check - should be non-empty string)
  if (typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    const errorMsg = `OTP configuration failed: OTP_API_KEY is invalid. Please set a valid API key in your .env file.`;
    console.error('❌ OTP Configuration Error:');
    console.error('   Invalid: OTP_API_KEY is empty or invalid');
    throw new Error(errorMsg);
  }

  // Determine base URL
  let finalBaseUrl;
  const providerDefaults = PROVIDER_DEFAULTS[provider];
  
  // Check if apiBaseUrl is provided and not a placeholder
  const isPlaceholder = apiBaseUrl && (
    apiBaseUrl.includes('<provider-base-url>') ||
    apiBaseUrl.includes('placeholder') ||
    apiBaseUrl.includes('<') ||
    !apiBaseUrl.startsWith('http')
  );
  
  if (apiBaseUrl && !isPlaceholder) {
    // Use provided URL if it's valid
    finalBaseUrl = apiBaseUrl.trim();
  } else if (isPlaceholder) {
    // If placeholder detected, use provider default
    console.warn(`⚠️  OTP_API_BASE_URL contains placeholder, using provider default for ${provider}`);
    if (providerDefaults && !providerDefaults.requiresBaseUrl) {
      finalBaseUrl = providerDefaults.baseUrl;
    } else {
      const errorMsg = `OTP configuration failed: OTP_API_BASE_URL is required for provider ${provider} but contains placeholder. Please set a valid URL in your .env file.`;
      console.error('❌ OTP Configuration Error:');
      console.error(`   Invalid: OTP_API_BASE_URL contains placeholder`);
      throw new Error(errorMsg);
    }
  } else if (providerDefaults && !providerDefaults.requiresBaseUrl) {
    // No URL provided, use provider default
    finalBaseUrl = providerDefaults.baseUrl;
  } else if (providerDefaults && providerDefaults.requiresBaseUrl) {
    const errorMsg = `OTP configuration failed: OTP_API_BASE_URL is required for provider ${provider}. Please set this in your .env file.`;
    console.error('❌ OTP Configuration Error:');
    console.error(`   Missing: OTP_API_BASE_URL (required for ${provider})`);
    throw new Error(errorMsg);
  } else {
    // Fallback to API_HOME default if provider not recognized
    finalBaseUrl = PROVIDER_DEFAULTS.API_HOME.baseUrl;
    console.warn(`⚠️  Unknown provider ${provider}, using API_HOME defaults`);
  }
  
  // Validate final base URL
  if (!finalBaseUrl || !finalBaseUrl.startsWith('http')) {
    const errorMsg = `OTP configuration failed: Invalid OTP_API_BASE_URL: ${finalBaseUrl}. Please set a valid URL in your .env file.`;
    console.error('❌ OTP Configuration Error:');
    console.error(`   Invalid: OTP_API_BASE_URL must be a valid HTTP/HTTPS URL`);
    throw new Error(errorMsg);
  }

  // Validate numeric values
  if (isNaN(expiryMinutes) || expiryMinutes < 1 || expiryMinutes > 60) {
    throw new Error('OTP_EXPIRY_MINUTES must be between 1 and 60');
  }
  if (isNaN(resendCooldownSeconds) || resendCooldownSeconds < 10 || resendCooldownSeconds > 300) {
    throw new Error('OTP_RESEND_COOLDOWN_SECONDS must be between 10 and 300');
  }
  if (isNaN(maxAttempts) || maxAttempts < 1 || maxAttempts > 10) {
    throw new Error('OTP_MAX_ATTEMPTS must be between 1 and 10');
  }

  try {
    otpConfig = {
      provider,
      apiKey: apiKey.trim(),
      apiBaseUrl: finalBaseUrl,
      senderId: senderId ? senderId.trim() : null,
      templateId: templateId ? templateId.trim() : null,
      expiryMinutes,
      resendCooldownSeconds,
      maxAttempts,
      testMode, // Temporary testing mode - skips SMS sending
    };
    
    isConfigured = true;
    
    // Safe logging - mask API key
    const maskedKey = otpConfig.apiKey.length > 10 
      ? `${otpConfig.apiKey.substring(0, 6)}...${otpConfig.apiKey.substring(otpConfig.apiKey.length - 4)}`
      : '***masked***';
    
    console.log('✅ OTP Service configured successfully');
    console.log(`   Provider: ${otpConfig.provider}`);
    console.log(`   API Key: ${maskedKey} (masked)`);
    console.log(`   Base URL: ${otpConfig.apiBaseUrl}`);
    console.log(`   Expiry: ${otpConfig.expiryMinutes} minutes`);
    console.log(`   Resend Cooldown: ${otpConfig.resendCooldownSeconds} seconds`);
    console.log(`   Max Attempts: ${otpConfig.maxAttempts}`);
    if (testMode) {
      console.log(`   ⚠️  TEST MODE: OTP will NOT be sent via SMS (OTP_TEST_MODE=true)`);
      console.log(`   ⚠️  OTP will be returned in API response for testing only`);
    } else {
      console.log(`   Status: OTP service ready for SMS sending`);
    }
    
    return otpConfig;
  } catch (configError) {
    console.error('❌ OTP configuration failed:', configError.message);
    throw new Error(`Failed to configure OTP service: ${configError.message}`);
  }
};

// Configure immediately on import (fail fast)
const config = configureOTP();

/**
 * Get OTP configuration
 * @returns {Object} Complete OTP configuration
 */
export const getOTPConfig = () => {
  if (!isConfigured || !otpConfig) {
    throw new Error('OTP service is not configured. Please check your .env file for OTP_API_KEY.');
  }
  return { ...otpConfig }; // Return copy to prevent mutation
};

/**
 * Get OTP configuration status (safe - no secrets)
 * @returns {Object} Configuration status
 */
export const getOTPConfigStatus = () => {
  return {
    configured: isConfigured,
    provider: otpConfig?.provider || process.env.OTP_PROVIDER || 'API_HOME',
    hasApiKey: !!process.env.OTP_API_KEY,
    apiBaseUrl: otpConfig?.apiBaseUrl || null,
    expiryMinutes: otpConfig?.expiryMinutes || 10,
    resendCooldownSeconds: otpConfig?.resendCooldownSeconds || 60,
    maxAttempts: otpConfig?.maxAttempts || 5,
    testMode: otpConfig?.testMode || false,
  };
};

export default {
  getOTPConfig,
  getOTPConfigStatus,
};
