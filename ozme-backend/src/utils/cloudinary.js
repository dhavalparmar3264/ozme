import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload image to Cloudinary
 * @param {string} filePath - Path to the image file or base64 string
 * @param {string} folder - Folder name in Cloudinary (default: 'ozme-products')
 * @returns {Promise<Object>} - Upload result with URL and public_id
 */
export const uploadImage = async (filePath, folder = 'ozme-products') => {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: folder,
            resource_type: 'image',
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
        throw new Error('Failed to upload image to Cloudinary');
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
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        throw new Error('Failed to delete image from Cloudinary');
    }
};

/**
 * Delete multiple images from Cloudinary
 * @param {Array<string>} publicIds - Array of public IDs to delete
 * @returns {Promise<Object>} - Delete result
 */
export const deleteMultipleImages = async (publicIds) => {
    try {
        const result = await cloudinary.api.delete_resources(publicIds);
        return result;
    } catch (error) {
        console.error('Cloudinary multiple delete error:', error);
        throw new Error('Failed to delete images from Cloudinary');
    }
};

export default cloudinary;
