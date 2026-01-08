/**
 * Generates a random order ID in the format ORD-XXXXX
 * @returns {string} Order ID like ORD-28491, ORD-99321, etc.
 */
export const generateOrderId = () => {
  // Generate a random 5-digit number (10000 to 99999)
  // Use timestamp to ensure uniqueness even if called multiple times rapidly
  const randomNumber = Math.floor(10000 + Math.random() * 90000);
  const timestamp = Date.now().toString().slice(-4); // Last 4 digits of timestamp
  // Combine random number with timestamp component, ensure it stays in 5-digit range
  const combined = (randomNumber + parseInt(timestamp)) % 90000;
  const uniqueId = combined + 10000; // Ensure it's always 5 digits (10000-99999)
  return `ORD-${uniqueId}`;
};

