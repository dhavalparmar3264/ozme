/**
 * API Client utility for making HTTP requests
 * Can be used by frontend or for testing
 */

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://82.112.231.165:3002/api';

/**
 * Make API request
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} Response data
 */
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('token');
  const guestToken = document.cookie
    .split('; ')
    .find((row) => row.startsWith('guestToken='))
    ?.split('=')[1];

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (guestToken && !token) {
    headers['x-guest-token'] = guestToken;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Include cookies
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export default apiRequest;

