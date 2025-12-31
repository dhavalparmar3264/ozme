import jwt from 'jsonwebtoken';

/**
 * Generate JWT Token
 * @param {string} userId - User ID
 * @param {string} secret - JWT secret (optional, defaults to JWT_SECRET)
 * @param {string} expiresIn - Token expiry (optional, defaults to JWT_EXPIRE or '7d')
 * @returns {string} JWT token
 */
export const generateToken = (userId, secret = null, expiresIn = null) => {
  const jwtSecret = secret || process.env.JWT_SECRET;
  const tokenExpiry = expiresIn || process.env.JWT_EXPIRE || '7d';
  return jwt.sign({ id: userId }, jwtSecret, {
    expiresIn: tokenExpiry,
  });
};

