import crypto from 'crypto';

/**
 * Generate a unique guest token for anonymous users
 * @returns {string} Guest token
 */
export const generateGuestToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

