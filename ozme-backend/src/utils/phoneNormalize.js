/**
 * Phone Number Normalization Utility
 * Ensures all phone numbers are stored in a consistent format for uniqueness enforcement
 */

/**
 * Normalize phone number to 10-digit Indian format (for storage)
 * Accepts: +91XXXXXXXXXX, 91XXXXXXXXXX, or 10-digit
 * Returns: 10-digit string (e.g., "9876543210")
 * 
 * @param {string} phone - Phone number in any format
 * @returns {string} - Normalized 10-digit phone number
 */
export const normalizePhone = (phone) => {
  if (!phone) return null;
  
  // Remove all non-digit characters
  let cleanPhone = phone.replace(/\D/g, '');
  
  // Remove country code if present (91XXXXXXXXXX -> XXXXXXXXXX)
  if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
    cleanPhone = cleanPhone.slice(2);
  } else if (cleanPhone.startsWith('91') && cleanPhone.length > 12) {
    // Handle cases like 919876543210 (12+ digits)
    cleanPhone = cleanPhone.slice(-10);
  } else {
    // Take last 10 digits (handles any format)
    cleanPhone = cleanPhone.slice(-10);
  }
  
  // Validate: Must be exactly 10 digits starting with 6-9
  if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
    return null; // Invalid format
  }
  
  return cleanPhone;
};

/**
 * Format phone for display (E.164 format)
 * @param {string} phone - 10-digit phone number
 * @returns {string} - Formatted as +91XXXXXXXXXX
 */
export const formatPhoneForDisplay = (phone) => {
  if (!phone) return '';
  const normalized = normalizePhone(phone);
  return normalized ? `+91${normalized}` : phone;
};

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid 10-digit Indian mobile
 */
export const isValidIndianPhone = (phone) => {
  const normalized = normalizePhone(phone);
  return normalized !== null;
};

