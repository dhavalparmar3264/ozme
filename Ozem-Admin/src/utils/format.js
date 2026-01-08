/**
 * Format currency in Indian Rupees (INR)
 * @param {number} amount - The amount to format
 * @param {object} options - Formatting options
 * @returns {string} Formatted currency string (e.g., "₹5,000")
 */
export const formatINR = (amount, options = {}) => {
  const {
    maximumFractionDigits = 0,
    minimumFractionDigits = 0,
  } = options;

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits,
    minimumFractionDigits,
  }).format(amount || 0);
};

/**
 * Format currency as simple string with ₹ symbol
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string (e.g., "₹5,000")
 */
export const formatCurrency = (amount) => {
  return `₹${(amount || 0).toLocaleString('en-IN')}`;
};

