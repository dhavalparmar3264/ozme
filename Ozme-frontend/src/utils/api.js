/**
 * API utility for frontend
 * Handles all API requests with error handling and token management
 */

// Get API base URL from environment, default to production URL
// In production, use https://ozme.in/api (or https://www.ozme.in/api if behind reverse proxy)
// For development, use http://localhost:3002/api or the IP address
const getApiBaseUrl = () => {
  // Priority 1: Environment variable
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Priority 2: Auto-detect based on hostname
  const hostname = window.location.hostname;
  if (hostname === 'ozme.in' || hostname === 'www.ozme.in') {
    // Use same protocol as current page (https in production)
    const protocol = window.location.protocol;
    return `${protocol}//${hostname}/api`;
  }
  
  // Priority 3: Development fallback
  return 'http://82.112.231.165:3002/api';
};

const API_BASE_URL = getApiBaseUrl();

// Log API base URL on load (for debugging)
console.log('🌐 API Base URL:', API_BASE_URL);
console.log('🌐 Current hostname:', window.location.hostname);
console.log('🌐 Current protocol:', window.location.protocol);

/**
 * Get auth token from localStorage
 */
const getToken = () => {
  return localStorage.getItem('token');
};

/**
 * Get guest token from cookies
 */
const getGuestToken = () => {
  const cookies = document.cookie.split('; ');
  const guestCookie = cookies.find((row) => row.startsWith('guestToken='));
  return guestCookie ? guestCookie.split('=')[1] : null;
};

/**
 * Make API request
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} Response data
 */
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getToken();
  const guestToken = getGuestToken();

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
      credentials: 'include', // Include cookies for guest tokens
    });

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return null;
    }

    const data = await response.json();

    if (!response.ok) {
      // For authentication errors (401, 403), throw with error data for proper handling
      if (response.status === 401 || response.status === 403) {
        const authError = new Error(data.message || `API request failed: ${response.status}`);
        authError.response = { status: response.status, data };
        authError.errorCode = data.errorCode;
        throw authError;
      }
      
      // For 404s, throw error with clear message
      if (response.status === 404) {
        console.error(`❌ Endpoint not found: ${url}`);
        console.error(`   API Base URL: ${API_BASE_URL}`);
        console.error(`   Full URL: ${url}`);
        console.error(`   This usually means:`);
        console.error(`   1. Backend route doesn't exist or server not restarted`);
        console.error(`   2. API base URL is incorrect (current: ${API_BASE_URL})`);
        console.error(`   3. Nginx/reverse proxy not configured correctly`);
        console.error(`   4. Backend server is not running on port 3002`);
        const notFoundError = new Error(`Backend API endpoint not found. The payment service may not be deployed or the server needs to be restarted.`);
        notFoundError.response = { status: 404, data };
        notFoundError.errorCode = 'ENDPOINT_NOT_FOUND';
        throw notFoundError;
      }
      
      // For other errors, throw with error data
      const apiError = new Error(data.message || `API request failed: ${response.status}`);
      apiError.response = { status: response.status, data };
      apiError.errorCode = data.errorCode;
      throw apiError;
    }

    return data;
  } catch (error) {
    // Detect connection refused / network errors
    // Check for various network error patterns including ERR_CONNECTION_REFUSED
    const isConnectionError = 
      (error.message && (
        error.message.includes('Failed to fetch') || 
        error.message.includes('NetworkError') ||
        error.message.includes('Network request failed') ||
        error.message.includes('ERR_CONNECTION_REFUSED') ||
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('ERR_NETWORK')
      )) ||
      error.code === 'ERR_NETWORK' ||
      error.code === 'ECONNREFUSED' ||
      (error.name === 'TypeError' && error.message && error.message.includes('fetch')) ||
      // Check if error is a network error (no response object means connection failed)
      (!error.response && error.message);

    if (isConnectionError) {
      // Log error for debugging
      console.error('Backend offline. API request failed:', {
        endpoint,
        error: error.message,
        url
      });

      // Return structured error object for auth endpoints
      if (endpoint.includes('/auth/')) {
        return {
          success: false,
          message: 'Unable to connect to the server. The backend may be offline.',
          errorCode: 'BACKEND_OFFLINE',
          isOffline: true
        };
      }

      // For other endpoints, return null for graceful fallback
      return null;
    }
    
    // Re-throw authentication and API errors so they can be handled by callers
    if (error.response || error.errorCode) {
      throw error;
    }
    
    // For unexpected errors, return structured error for auth endpoints
    if (endpoint.includes('/auth/')) {
      return {
        success: false,
        message: 'An unexpected error occurred. Please try again.',
        errorCode: 'UNKNOWN_ERROR'
      };
    }
    
    // For other endpoints, return null to prevent component crashes
    console.error('API request error:', error);
    return null;
  }
};

/**
 * Check backend health
 * @returns {Promise<boolean>} True if backend is reachable
 */
export const checkBackendHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/api/health`, {
      method: 'GET',
    });
    return response.ok;
  } catch (error) {
    return false;
  }
};

export default apiRequest;

