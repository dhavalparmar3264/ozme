/**
 * SMS Utility for sending OTPs
 * 
 * Uses centralized OTP configuration from src/config/otp.js
 * Supports multiple providers via configuration
 */

import { getOTPConfig } from '../config/otp.js';

/**
 * Generate a 6-digit OTP
 * @returns {string} 6-digit OTP
 */
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Mask phone number for logging (safe - no full phone in logs)
 * @param {string} phone - 10-digit phone number
 * @returns {string} Masked phone like ******3210
 */
const maskPhoneForLog = (phone) => {
  if (!phone || phone.length < 4) return '****';
  const lastFour = phone.slice(-4);
  return `******${lastFour}`;
};

/**
 * Send OTP via SMS using configured provider
 * @param {string} phone - 10-digit Indian phone number (without +91)
 * @param {string} otp - 6-digit OTP
 * @returns {Promise<{success: boolean, message: string, errorCode?: string, data?: any}>}
 */
export const sendOTP = async (phone, otp) => {
  const endpoint = 'sendOTP';
  const maskedPhone = maskPhoneForLog(phone);
  
  try {
    // Get OTP configuration (throws if not configured)
    let otpConfig;
    try {
      otpConfig = getOTPConfig();
    } catch (configError) {
      console.error(`[${endpoint}] Configuration error:`, configError.message);
      return {
        success: false,
        message: 'SMS service not configured. Please check server configuration.',
        errorCode: 'OTP_CONFIG_ERROR',
      };
    }

    // Validate API base URL is not a placeholder
    if (!otpConfig.apiBaseUrl || 
        otpConfig.apiBaseUrl.includes('<provider-base-url>') || 
        otpConfig.apiBaseUrl.includes('placeholder') ||
        !otpConfig.apiBaseUrl.startsWith('http')) {
      console.error(`[${endpoint}] Invalid API base URL: ${otpConfig.apiBaseUrl ? 'placeholder detected' : 'missing'}`);
      return {
        success: false,
        message: 'OTP provider base URL not configured',
        errorCode: 'OTP_PROVIDER_URL_ERROR',
      };
    }

    // Validate phone number (10-digit Indian mobile)
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      console.error(`[${endpoint}] Invalid phone format: ${maskedPhone}`);
      return {
        success: false,
        message: 'Invalid phone number format',
        errorCode: 'INVALID_PHONE_FORMAT',
      };
    }

    // Build API URL using centralized config (provider-specific)
    let url;
    try {
      if (otpConfig.provider === 'API_HOME') {
        // API Home format: ?key=API_KEY&mobile=PHONE&otp=OTP
        url = `${otpConfig.apiBaseUrl}?key=${otpConfig.apiKey}&mobile=${cleanPhone}&otp=${otp}`;
        
        // Add optional sender ID and template ID if provided
        if (otpConfig.senderId) {
          url += `&sender=${encodeURIComponent(otpConfig.senderId)}`;
        }
        if (otpConfig.templateId) {
          url += `&template=${encodeURIComponent(otpConfig.templateId)}`;
        }
      } else {
        // For other providers, use base URL with standard query params
        url = `${otpConfig.apiBaseUrl}?key=${otpConfig.apiKey}&mobile=${cleanPhone}&otp=${otp}`;
        if (otpConfig.senderId) {
          url += `&sender=${encodeURIComponent(otpConfig.senderId)}`;
        }
        if (otpConfig.templateId) {
          url += `&template=${encodeURIComponent(otpConfig.templateId)}`;
        }
      }
    } catch (urlError) {
      console.error(`[${endpoint}] URL construction error:`, urlError.message);
      return {
        success: false,
        message: 'Failed to construct OTP provider URL',
        errorCode: 'OTP_URL_CONSTRUCTION_ERROR',
      };
    }

    // Check if test mode is enabled
    if (otpConfig.testMode) {
      // TEST MODE: Skip SMS sending, return OTP in response
      console.log(`[${endpoint}] ⚠️  TEST MODE: Skipping SMS send to ${maskedPhone}`);
      console.log(`[${endpoint}] ⚠️  TEST MODE: OTP for ${maskedPhone} is: ${otp}`);
      console.log(`[${endpoint}] ⚠️  TEST MODE: OTP will be returned in API response`);
      
      return {
        success: true,
        message: 'OTP generated successfully (TEST MODE - no SMS sent)',
        data: {
          testMode: true,
          otp: otp, // Return OTP for testing
          phone: maskedPhone,
          message: 'This OTP is only visible in test mode. In production, OTP is sent via SMS.',
        },
      };
    }

    // PRODUCTION MODE: Send SMS via provider
    // Safe logging - no secrets
    console.log(`[${endpoint}] Sending OTP to ${maskedPhone} via ${otpConfig.provider}`);
    console.log(`[${endpoint}] Provider base URL: ${otpConfig.apiBaseUrl}`);

    // Make API request
    let response;
    let responseStatus;
    let responseData;
    
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        // Add timeout
        signal: AbortSignal.timeout(30000), // 30 seconds timeout
      });
      
      responseStatus = response.status;
      responseData = await response.text();
      
      // Safe logging - truncate response, remove potential secrets
      const safeResponse = responseData.length > 200 
        ? responseData.substring(0, 200) + '...' 
        : responseData;
      const sanitizedResponse = safeResponse.replace(/key=[^&]*/gi, 'key=***').replace(/api[_-]?key[=:][^\s&]*/gi, 'api_key=***');
      
      console.log(`[${endpoint}] Provider response status: ${responseStatus}`);
      console.log(`[${endpoint}] Provider response (sanitized): ${sanitizedResponse}`);
      
    } catch (fetchError) {
      console.error(`[${endpoint}] Fetch error:`, fetchError.message);
      console.error(`[${endpoint}] Stack trace:`, fetchError.stack);
      
      if (fetchError.name === 'AbortError') {
        return {
          success: false,
          message: 'OTP provider request timeout',
          errorCode: 'OTP_PROVIDER_TIMEOUT',
        };
      }
      
      return {
        success: false,
        message: 'Failed to connect to OTP provider',
        errorCode: 'OTP_PROVIDER_CONNECTION_ERROR',
      };
    }

    // Check for authentication errors
    if (responseStatus === 401 || responseStatus === 403) {
      console.error(`[${endpoint}] Provider authentication failed: ${responseStatus}`);
      return {
        success: false,
        message: 'OTP provider auth failed',
        errorCode: 'OTP_PROVIDER_AUTH_ERROR',
      };
    }

    // Check if response indicates success
    // API Home typically returns success/failure status
    const isSuccess = response.ok && 
                     !responseData.toLowerCase().includes('error') && 
                     !responseData.toLowerCase().includes('fail') &&
                     !responseData.toLowerCase().includes('invalid');

    if (isSuccess) {
      console.log(`[${endpoint}] OTP sent successfully to ${maskedPhone}`);
      return {
        success: true,
        message: 'OTP sent successfully',
        data: responseData,
      };
    } else {
      console.error(`[${endpoint}] Provider returned error response`);
      return {
        success: false,
        message: responseData || 'Failed to send OTP',
        errorCode: 'OTP_PROVIDER_ERROR',
      };
    }
  } catch (error) {
    // Catch any unexpected errors
    console.error(`[${endpoint}] Unexpected error:`, error.message);
    console.error(`[${endpoint}] Stack trace:`, error.stack);
    return {
      success: false,
      message: 'An unexpected error occurred while sending OTP',
      errorCode: 'OTP_UNEXPECTED_ERROR',
    };
  }
};

/**
 * Format phone number for display (mask middle digits)
 * @param {string} phone - 10-digit phone number
 * @returns {string} Masked phone like ******3210
 */
export const maskPhone = (phone) => {
  if (!phone || phone.length < 4) return phone;
  const lastFour = phone.slice(-4);
  return `******${lastFour}`;
};

export default {
  generateOTP,
  sendOTP,
  maskPhone,
};
