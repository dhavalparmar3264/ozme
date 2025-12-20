/**
 * SMS Utility for sending OTPs via API Home
 * API Documentation: https://apihome.in/panel/api/bulksms/
 */

const API_HOME_KEY = process.env.API_HOME_API;
const API_HOME_URL = 'https://apihome.in/panel/api/bulksms/';

/**
 * Generate a 6-digit OTP
 * @returns {string} 6-digit OTP
 */
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP via SMS using API Home
 * @param {string} phone - 10-digit Indian phone number (without +91)
 * @param {string} otp - 6-digit OTP
 * @returns {Promise<{success: boolean, message: string, data?: any}>}
 */
export const sendOTP = async (phone, otp) => {
  try {
    if (!API_HOME_KEY) {
      console.error('API_HOME_API key not configured');
      return {
        success: false,
        message: 'SMS service not configured',
      };
    }

    // Validate phone number (10-digit Indian mobile)
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      return {
        success: false,
        message: 'Invalid phone number format',
      };
    }

    // Build API URL
    const url = `${API_HOME_URL}?key=${API_HOME_KEY}&mobile=${cleanPhone}&otp=${otp}`;

    console.log(`Sending OTP to ${cleanPhone}...`);

    // Make API request
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await response.text();
    console.log('SMS API Response:', data);

    // Check if response indicates success
    // API Home typically returns success/failure status
    const isSuccess = response.ok && !data.toLowerCase().includes('error') && !data.toLowerCase().includes('fail');

    if (isSuccess) {
      return {
        success: true,
        message: 'OTP sent successfully',
        data: data,
      };
    } else {
      return {
        success: false,
        message: data || 'Failed to send OTP',
      };
    }
  } catch (error) {
    console.error('SMS sending error:', error);
    return {
      success: false,
      message: error.message || 'Failed to send SMS',
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


