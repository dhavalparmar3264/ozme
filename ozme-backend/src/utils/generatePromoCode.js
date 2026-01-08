/**
 * Generate a feedback promo code
 * Format: OZME + 4 numeric digits (0-9)
 * Example: OZME4829, OZME9173, OZME0046
 * Total length: Exactly 8 characters
 * 
 * @returns {string} Promo code (format: OZME####)
 */
export const generateFeedbackPromoCode = () => {
  // Generate random 4-digit number (0000-9999)
  const numericSuffix = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0'); // Ensure exactly 4 digits with leading zeros if needed
  
  return `OZME${numericSuffix}`;
};

/**
 * Generate a unique feedback promo code with collision checking
 * Ensures the code doesn't already exist in the database
 * 
 * @param {Function} checkExists - Function to check if code exists (returns Promise<boolean>)
 * @param {number} maxAttempts - Maximum attempts to generate unique code (default: 100)
 * @returns {Promise<string>} Unique promo code
 */
export const generateUniqueFeedbackPromoCode = async (checkExists, maxAttempts = 100) => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateFeedbackPromoCode();
    const exists = await checkExists(code);
    
    if (!exists) {
      return code;
    }
    
    // Log collision for debugging (only every 10th attempt to avoid spam)
    if (attempt > 0 && attempt % 10 === 0) {
      console.log(`⚠️  Promo code collision detected, attempt ${attempt + 1}/${maxAttempts}`);
    }
  }
  
  // If all attempts failed, throw error
  throw new Error(`Failed to generate unique promo code after ${maxAttempts} attempts. Please try again.`);
};
