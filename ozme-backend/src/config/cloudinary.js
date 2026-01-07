import 'dotenv/config'; // Load environment variables first
import { v2 as cloudinary } from 'cloudinary';

/**
 * Centralized Cloudinary Configuration
 * 
 * Reads credentials from environment variables:
 * - CLOUDINARY_CLOUD_NAME
 * - CLOUDINARY_API_KEY
 * - CLOUDINARY_API_SECRET
 * 
 * Throws clear error if any variable is missing (fail fast)
 * Exports configured Cloudinary instance for reuse
 */

let isConfigured = false;

/**
 * Configure Cloudinary with environment variables
 * Called automatically on module import (fail fast)
 */
const configureCloudinary = () => {
  if (isConfigured) {
    return cloudinary;
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  // Fail fast - throw clear error if any variable is missing
  if (!cloudName || !apiKey || !apiSecret) {
    const missing = [];
    if (!cloudName) missing.push('CLOUDINARY_CLOUD_NAME');
    if (!apiKey) missing.push('CLOUDINARY_API_KEY');
    if (!apiSecret) missing.push('CLOUDINARY_API_SECRET');
    
    const errorMsg = `Cloudinary configuration failed: Missing environment variables: ${missing.join(', ')}. Please set these in your .env file and restart the server.`;
    console.error('❌ Cloudinary Configuration Error:');
    console.error(`   Missing: ${missing.join(', ')}`);
    console.error('💡 Please check your .env file and ensure all Cloudinary variables are set.');
    throw new Error(errorMsg);
  }

  try {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
    
    isConfigured = true;
    
    // Safe logging - no secrets
    console.log('✅ Cloudinary configured successfully');
    console.log(`   Cloud Name: ${cloudName}`);
    console.log(`   API Key: ${apiKey.substring(0, 6)}...${apiKey.substring(apiKey.length - 4)} (masked)`);
    console.log(`   Status: Cloudinary ready for image uploads`);
    
    return cloudinary;
  } catch (configError) {
    console.error('❌ Cloudinary configuration failed:', configError.message);
    throw new Error(`Failed to configure Cloudinary: ${configError.message}`);
  }
};

// Configure immediately on import (fail fast)
configureCloudinary();

/**
 * Get Cloudinary configuration status
 * @returns {Object} Configuration status (safe - no secrets)
 */
export const getCloudinaryConfig = () => {
  return {
    configured: isConfigured,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || null,
    hasApiKey: !!process.env.CLOUDINARY_API_KEY,
    hasApiSecret: !!process.env.CLOUDINARY_API_SECRET,
  };
};

// Export the configured Cloudinary instance
export default cloudinary;

