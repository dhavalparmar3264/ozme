/**
 * Get client IP address from request
 * Handles various proxy headers and connection info
 * @param {Object} req - Express request object
 * @returns {string} Client IP address
 */
export const getClientIp = (req) => {
  return req.ip || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress ||
         (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
         req.headers['x-real-ip'] ||
         req.headers['cf-connecting-ip'] || // Cloudflare
         'unknown';
};

/**
 * Get client user agent from request
 * @param {Object} req - Express request object
 * @returns {string} User agent string
 */
export const getClientUserAgent = (req) => {
  return req.headers['user-agent'] || 'unknown';
};

/**
 * Format phone number to E.164 format (+91XXXXXXXXXX)
 * @param {string} phone - 10-digit phone number
 * @returns {string} E.164 formatted phone number
 */
export const formatPhoneE164 = (phone) => {
  if (!phone) return null;
  const cleanPhone = phone.replace(/\D/g, '').slice(-10);
  if (/^[6-9]\d{9}$/.test(cleanPhone)) {
    return `+91${cleanPhone}`;
  }
  return null;
};

