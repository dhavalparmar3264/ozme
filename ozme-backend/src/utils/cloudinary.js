/**
 * Cloudinary Utility Functions
 * 
 * Uses centralized Cloudinary configuration from src/config/cloudinary.js
 * All credentials are read from environment variables only
 */

// Import the pre-configured Cloudinary instance
import cloudinary from '../config/cloudinary.js';

/**
 * Upload image to Cloudinary
 * @param {string} filePath - Path to the image file or base64 string
 * @param {string} folder - Folder name in Cloudinary (default: 'ozme-products')
 * @returns {Promise<Object>} - Upload result with URL and public_id
 */
export const uploadImage = async (filePath, folder = 'ozme-products') => {
    try {
        // Cloudinary is already configured via centralized config
        const result = await cloudinary.uploader.upload(filePath, {
            folder: folder,
            resource_type: 'image',
            overwrite: false, // Prevent overwriting existing images
            unique_filename: true, // Ensure unique filenames
            transformation: [
                { width: 1000, height: 1000, crop: 'limit' },
                { quality: 'auto' },
                { fetch_format: 'auto' },
            ],
        });

        return {
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        
        // Re-throw configuration errors as-is
        if (error.message.includes('configuration') || error.message.includes('Missing environment variables')) {
            throw error;
        }
        
        throw new Error(`Failed to upload image to Cloudinary: ${error.message || 'Unknown error'}`);
    }
};

/**
 * Upload multiple images to Cloudinary
 * @param {Array<string>} filePaths - Array of image paths or base64 strings
 * @param {string} folder - Folder name in Cloudinary
 * @returns {Promise<Array<Object>>} - Array of upload results
 */
export const uploadMultipleImages = async (filePaths, folder = 'ozme-products') => {
    try {
        const uploadPromises = filePaths.map((filePath) => uploadImage(filePath, folder));
        const results = await Promise.all(uploadPromises);
        return results;
    } catch (error) {
        console.error('Cloudinary multiple upload error:', error);
        throw new Error('Failed to upload images to Cloudinary');
    }
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Public ID of the image to delete
 * @returns {Promise<Object>} - Delete result
 */
export const deleteImage = async (publicId) => {
    try {
        // Cloudinary is already configured via centralized config
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        
        // Re-throw configuration errors as-is
        if (error.message.includes('configuration') || error.message.includes('Missing environment variables')) {
            throw error;
        }
        
        throw new Error(`Failed to delete image from Cloudinary: ${error.message || 'Unknown error'}`);
    }
};

/**
 * Delete multiple images from Cloudinary
 * @param {Array<string>} publicIds - Array of public IDs to delete
 * @returns {Promise<Object>} - Delete result
 */
export const deleteMultipleImages = async (publicIds) => {
    try {
        // Cloudinary is already configured via centralized config
        const result = await cloudinary.api.delete_resources(publicIds);
        return result;
    } catch (error) {
        console.error('Cloudinary multiple delete error:', error);
        
        // Re-throw configuration errors as-is
        if (error.message.includes('configuration') || error.message.includes('Missing environment variables')) {
            throw error;
        }
        
        throw new Error(`Failed to delete images from Cloudinary: ${error.message || 'Unknown error'}`);
    }
};

// Export the configured Cloudinary instance for direct use if needed
export default cloudinary;
