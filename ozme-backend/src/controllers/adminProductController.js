import Product from '../models/Product.js';
import Category from '../models/Category.js';
import { uploadMultipleImages, deleteImage } from '../utils/cloudinary.js';

/**
 * Sanitize product name for Cloudinary folder name
 * @param {string} productName - Product name
 * @returns {string} - Sanitized folder name
 */
const sanitizeFolderName = (productName) => {
  return productName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Normalize size value to match enum format
 * Converts "120 ml" to "120ML", "50 ml" to "50ML", etc.
 * Also handles invalid sizes like "100ML" by mapping to closest valid size
 * @param {string} size - Size value (e.g., "120 ml" or "120ML" or "100ML")
 * @returns {string} - Normalized size (e.g., "120ML")
 */
const normalizeSize = (size) => {
  if (!size) return '120ML';
  
  // Map lowercase with space to uppercase without space
  const sizeMap = {
    '50 ml': '50ML',
    '120 ml': '120ML',
    '150 ml': '150ML',
    '200 ml': '200ML',
    '250 ml': '250ML',
    '300 ml': '300ML',
  };
  
  // If it's already in the map, return the normalized value
  if (sizeMap[size.toLowerCase()]) {
    return sizeMap[size.toLowerCase()];
  }
  
  // Valid enum values
  const validSizes = ['50ML', '120ML', '150ML', '200ML', '250ML', '300ML'];
  
  // If it's already a valid uppercase size, return as-is
  if (validSizes.includes(size)) {
    return size;
  }
  
  // Handle invalid sizes by mapping to closest valid size
  // Extract numeric value from size string (e.g., "100ML" -> 100)
  const numericMatch = size.match(/(\d+)/);
  if (numericMatch) {
    const numericValue = parseInt(numericMatch[1], 10);
    
    // Map to closest valid size
    if (numericValue <= 50) return '50ML';
    if (numericValue <= 100) return '120ML'; // 100ML maps to 120ML (closest)
    if (numericValue <= 120) return '120ML';
    if (numericValue <= 150) return '150ML';
    if (numericValue <= 200) return '200ML';
    if (numericValue <= 250) return '250ML';
    return '300ML'; // Default for larger sizes
  }
  
  // Default fallback
  return '120ML';
};

/**
 * Get all products with pagination and search
 * @route GET /api/admin/products
 */
export const getAdminProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const category = req.query.category || '';
    const gender = req.query.gender || '';
    const active = req.query.active !== undefined ? req.query.active === 'true' : undefined;

    // Build query
    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    
    if (category) {
      query.category = category;
    }
    
    if (gender) {
      query.gender = gender;
    }
    
    if (active !== undefined) {
      query.active = active;
    }

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

/**
 * Create new product
 * @route POST /api/admin/products
 */
export const createAdminProduct = async (req, res) => {
  try {
    // Log request size for debugging (safe - no secrets)
    const contentLength = req.headers['content-length'];
    const contentType = req.headers['content-type'];
    console.log('📤 Product creation request:', {
      method: req.method,
      contentType: contentType?.substring(0, 50) || 'unknown',
      contentLength: contentLength ? `${(parseInt(contentLength) / 1024 / 1024).toFixed(2)}MB` : 'unknown',
      fileCount: req.files?.length || 0,
      hasFiles: !!(req.files && req.files.length > 0),
    });

    // Parse product data from FormData
    let productData;
    if (req.body.productData) {
      productData = typeof req.body.productData === 'string' 
        ? JSON.parse(req.body.productData) 
        : req.body.productData;
    } else {
      productData = req.body;
    }

    // Validate required fields
    if (!productData.name || !productData.description || !productData.category || !productData.gender) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, description, category, gender',
      });
    }

    // Validate sizes array if provided
    if (productData.sizes && Array.isArray(productData.sizes)) {
      if (productData.sizes.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Sizes array must contain at least one size',
        });
      }

      // Validate each size object
      const usedSizes = new Set();
      for (const sizeObj of productData.sizes) {
        if (!sizeObj.size || !sizeObj.price) {
          return res.status(400).json({
            success: false,
            message: 'Each size must have size and price',
          });
        }
        
        // Check for duplicate sizes
        if (usedSizes.has(sizeObj.size)) {
          return res.status(400).json({
            success: false,
            message: `Duplicate size found: ${sizeObj.size}. Each size can only be added once.`,
          });
        }
        usedSizes.add(sizeObj.size);

        // Validate MRP >= Price for each size
        if (sizeObj.originalPrice && sizeObj.price && parseFloat(sizeObj.originalPrice) < parseFloat(sizeObj.price)) {
          return res.status(400).json({
            success: false,
            message: `MRP must be greater than or equal to selling price for size ${sizeObj.size}`,
          });
        }

        // Validate stockQuantity
        if (sizeObj.stockQuantity === undefined || sizeObj.stockQuantity === null) {
          sizeObj.stockQuantity = 0;
        }
        sizeObj.stockQuantity = parseInt(sizeObj.stockQuantity) || 0;
        sizeObj.inStock = sizeObj.stockQuantity > 0;
      }
    } else {
      // Backward compatibility: validate single price field
      if (!productData.price) {
        return res.status(400).json({
          success: false,
          message: 'Missing required field: price (or sizes array)',
        });
      }

      // Validate MRP >= Price
      if (productData.originalPrice && productData.price && parseFloat(productData.originalPrice) < parseFloat(productData.price)) {
        return res.status(400).json({
          success: false,
          message: 'MRP (originalPrice) must be greater than or equal to selling price',
        });
      }
    }

    // Validate category exists (optional check)
    if (productData.category) {
      const categoryExists = await Category.findOne({ name: productData.category, active: true });
      if (!categoryExists) {
        console.warn(`Category "${productData.category}" not found in Category collection`);
      }
    }

    // Check if images are provided (either files or existing images)
    const hasFiles = req.files && req.files.length > 0;
    const hasExistingImages = productData.existingImages && productData.existingImages.length > 0;

    if (!hasFiles && !hasExistingImages) {
      return res.status(400).json({
        success: false,
        message: 'At least one product image is required',
      });
    }

    if (hasFiles && req.files.length > 10) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 10 images allowed',
      });
    }

    // Create product in DB first (without images, or with existing images if editing)
    const productToCreate = {
      name: productData.name,
      shortDescription: productData.shortDescription,
      description: productData.description,
      category: productData.category,
      gender: productData.gender,
      tag: productData.tag,
      active: productData.active !== undefined ? productData.active : true,
      images: productData.existingImages || [], // Start with existing images if any
    };

    // Handle sizes array or single size (backward compatibility)
    if (productData.sizes && Array.isArray(productData.sizes) && productData.sizes.length > 0) {
      // Use sizes array - normalize size values
      productToCreate.sizes = productData.sizes.map(sizeObj => ({
        size: normalizeSize(sizeObj.size),
        price: parseFloat(sizeObj.price),
        originalPrice: sizeObj.originalPrice ? parseFloat(sizeObj.originalPrice) : undefined,
        stockQuantity: parseInt(sizeObj.stockQuantity) || 0,
        inStock: (parseInt(sizeObj.stockQuantity) || 0) > 0,
      }));

      // For backward compatibility, set single size/price fields from first size
      productToCreate.size = productToCreate.sizes[0].size;
      productToCreate.price = productToCreate.sizes[0].price;
      productToCreate.originalPrice = productToCreate.sizes[0].originalPrice;
      productToCreate.stockQuantity = productToCreate.sizes.reduce((sum, s) => sum + s.stockQuantity, 0);
      productToCreate.inStock = productToCreate.sizes.some(s => s.inStock);
    } else {
      // Backward compatibility: single size - normalize size value
      productToCreate.size = normalizeSize(productData.size);
      productToCreate.price = parseFloat(productData.price);
      productToCreate.originalPrice = productData.originalPrice ? parseFloat(productData.originalPrice) : undefined;
      productToCreate.stockQuantity = parseInt(productData.stockQuantity) || 0;
      productToCreate.inStock = parseInt(productData.stockQuantity) > 0;
    }

    const product = await Product.create(productToCreate);

    // Upload new images to Cloudinary if files are provided
    let uploadedImageUrls = [];
    if (hasFiles) {
      try {
        // Create folder structure: products_images/{product_name}/
        const folderName = sanitizeFolderName(productData.name);
        const cloudinaryFolder = `products_images/${folderName}`;

        // Convert files to base64 for Cloudinary
        const filePaths = req.files.map(file => {
          const base64 = file.buffer.toString('base64');
          return `data:${file.mimetype};base64,${base64}`;
        });

        // Upload images to Cloudinary
        const uploadResults = await uploadMultipleImages(filePaths, cloudinaryFolder);
        uploadedImageUrls = uploadResults.map(result => result.url);
      } catch (uploadError) {
        // If upload fails, delete the product and return error
        await Product.findByIdAndDelete(product._id);
        console.error('Image upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: `Failed to upload images: ${uploadError.message}`,
        });
      }
    }

    // Update product with all image URLs (existing + new)
    const allImages = [...(productData.existingImages || []), ...uploadedImageUrls];
    product.images = allImages;
    await product.save();

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { product },
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

/**
 * Update product
 * @route PUT /api/admin/products/:id
 */
export const updateAdminProduct = async (req, res) => {
  try {
    // Parse product data from FormData
    let productData;
    if (req.body.productData) {
      productData = typeof req.body.productData === 'string' 
        ? JSON.parse(req.body.productData) 
        : req.body.productData;
    } else {
      productData = req.body;
    }

    // Find existing product
    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Prepare update object
    const updateData = {};

    // Handle sizes array if provided
    if (productData.sizes !== undefined && Array.isArray(productData.sizes)) {
      if (productData.sizes.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Sizes array must contain at least one size',
        });
      }

      // Validate each size object
      const usedSizes = new Set();
      for (const sizeObj of productData.sizes) {
        if (!sizeObj.size || !sizeObj.price) {
          return res.status(400).json({
            success: false,
            message: 'Each size must have size and price',
          });
        }
        
        // Check for duplicate sizes
        if (usedSizes.has(sizeObj.size)) {
          return res.status(400).json({
            success: false,
            message: `Duplicate size found: ${sizeObj.size}. Each size can only be added once.`,
          });
        }
        usedSizes.add(sizeObj.size);

        // Validate MRP >= Price for each size
        if (sizeObj.originalPrice && sizeObj.price && parseFloat(sizeObj.originalPrice) < parseFloat(sizeObj.price)) {
          return res.status(400).json({
            success: false,
            message: `MRP must be greater than or equal to selling price for size ${sizeObj.size}`,
          });
        }

        // Validate stockQuantity
        if (sizeObj.stockQuantity === undefined || sizeObj.stockQuantity === null) {
          sizeObj.stockQuantity = 0;
        }
        sizeObj.stockQuantity = parseInt(sizeObj.stockQuantity) || 0;
        sizeObj.inStock = sizeObj.stockQuantity > 0;
      }

      // Set sizes array - normalize size values
      updateData.sizes = productData.sizes.map(sizeObj => ({
        size: normalizeSize(sizeObj.size),
        price: parseFloat(sizeObj.price),
        originalPrice: sizeObj.originalPrice ? parseFloat(sizeObj.originalPrice) : undefined,
        stockQuantity: parseInt(sizeObj.stockQuantity) || 0,
        inStock: (parseInt(sizeObj.stockQuantity) || 0) > 0,
      }));

      // For backward compatibility, set single size/price fields from first size
      updateData.size = updateData.sizes[0].size;
      updateData.price = updateData.sizes[0].price;
      updateData.originalPrice = updateData.sizes[0].originalPrice;
      updateData.stockQuantity = updateData.sizes.reduce((sum, s) => sum + s.stockQuantity, 0);
      updateData.inStock = updateData.sizes.some(s => s.inStock);
    } else {
      // Handle single size fields (backward compatibility) - normalize size value
      if (productData.size !== undefined) updateData.size = normalizeSize(productData.size);
      if (productData.price !== undefined) {
        updateData.price = parseFloat(productData.price);
        // Validate MRP >= Price if both are provided
        if (productData.originalPrice !== undefined) {
          if (parseFloat(productData.originalPrice) < parseFloat(productData.price)) {
            return res.status(400).json({
              success: false,
              message: 'MRP (originalPrice) must be greater than or equal to selling price',
            });
          }
          updateData.originalPrice = parseFloat(productData.originalPrice);
        } else if (existingProduct.originalPrice && parseFloat(productData.price) > existingProduct.originalPrice) {
          return res.status(400).json({
            success: false,
            message: 'Selling price cannot be greater than MRP (originalPrice)',
          });
        }
      }
      if (productData.originalPrice !== undefined) {
        const currentPrice = productData.price !== undefined ? parseFloat(productData.price) : existingProduct.price;
        if (parseFloat(productData.originalPrice) < currentPrice) {
          return res.status(400).json({
            success: false,
            message: 'MRP (originalPrice) must be greater than or equal to selling price',
          });
        }
        updateData.originalPrice = parseFloat(productData.originalPrice);
      }
      if (productData.stockQuantity !== undefined) {
        updateData.stockQuantity = parseInt(productData.stockQuantity) || 0;
        updateData.inStock = updateData.stockQuantity > 0;
      }
    }

    // Handle other fields
    if (productData.name !== undefined) updateData.name = productData.name;
    if (productData.shortDescription !== undefined) updateData.shortDescription = productData.shortDescription;
    if (productData.description !== undefined) updateData.description = productData.description;
    if (productData.category !== undefined) updateData.category = productData.category;
    if (productData.gender !== undefined) updateData.gender = productData.gender;
    if (productData.tag !== undefined) updateData.tag = productData.tag;
    if (productData.active !== undefined) updateData.active = productData.active;

    // Handle images if provided
    if (productData.existingImages !== undefined) {
      updateData.images = productData.existingImages;
    }

    // Update product
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    // Handle new image uploads if files are provided
    if (req.files && req.files.length > 0) {
      try {
        // Create folder structure: products_images/{product_name}/
        const folderName = sanitizeFolderName(product.name);
        const cloudinaryFolder = `products_images/${folderName}`;

        // Convert files to base64 for Cloudinary
        const filePaths = req.files.map(file => {
          const base64 = file.buffer.toString('base64');
          return `data:${file.mimetype};base64,${base64}`;
        });

        // Upload images to Cloudinary
        const uploadResults = await uploadMultipleImages(filePaths, cloudinaryFolder);
        const uploadedImageUrls = uploadResults.map(result => result.url);

        // Update product with new images (append to existing)
        product.images = [...(product.images || []), ...uploadedImageUrls];
        await product.save();
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: `Failed to upload images: ${uploadError.message}`,
        });
      }
    }

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: { product },
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

/**
 * Delete product permanently (hard delete)
 * @route DELETE /api/admin/products/:id
 */
export const deleteAdminProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Hard delete - permanently remove from database
    await Product.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

/**
 * Delete product image
 * @route DELETE /api/admin/products/:productId/images
 */
export const deleteProductImage = async (req, res) => {
  try {
    console.log('DELETE /api/admin/products/:productId/images - Request received:', {
      method: req.method,
      url: req.url,
      params: req.params,
      body: req.body,
    });
    
    const { productId } = req.params;
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Image URL is required',
      });
    }

    // Find the product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Check if image exists in product images array
    const imageIndex = product.images.indexOf(imageUrl);
    if (imageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Image not found in product',
      });
    }

    // Prevent deleting the last image if it's the only one
    if (product.images.length === 1) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete the last image. Products must have at least one image.',
      });
    }

    // Extract public_id from Cloudinary URL
    // Cloudinary URLs format: https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{public_id}.{format}
    // or: https://res.cloudinary.com/{cloud_name}/image/upload/{transformation}/{public_id}.{format}
    // or: https://res.cloudinary.com/{cloud_name}/image/upload/{folder}/{public_id}.{format}
    let publicId = null;
    try {
      // Match Cloudinary URL pattern
      const cloudinaryMatch = imageUrl.match(/\/upload\/(.+)$/);
      if (cloudinaryMatch) {
        let path = cloudinaryMatch[1];
        
        // Remove version prefix if present (v1234567890/)
        path = path.replace(/^v\d+\//, '');
        
        // Remove transformation parameters if present (e.g., w_500,h_500,c_fill/)
        // Transformations are typically alphanumeric with underscores and commas, followed by /
        path = path.replace(/^[a-z0-9_,]+(?=\/)/, '');
        
        // Remove file extension
        publicId = path.replace(/\.[^/.]+$/, '');
        
        // Remove leading/trailing slashes
        publicId = publicId.replace(/^\/+|\/+$/g, '');
      }
    } catch (parseError) {
      console.warn('Could not parse Cloudinary public_id from URL:', imageUrl, parseError);
      // Continue with deletion from DB even if we can't delete from Cloudinary
    }

    // Remove image from product images array
    product.images = product.images.filter(img => img !== imageUrl);
    
    // Normalize sizes before saving to prevent validation errors
    if (product.size) {
      product.size = normalizeSize(product.size);
    }
    if (product.sizes && Array.isArray(product.sizes)) {
      product.sizes = product.sizes.map(sizeObj => ({
        ...sizeObj,
        size: normalizeSize(sizeObj.size),
      }));
    }
    
    await product.save();

    // Try to delete from Cloudinary if public_id was extracted
    if (publicId) {
      try {
        await deleteImage(publicId);
        console.log(`Deleted image from Cloudinary: ${publicId}`);
      } catch (cloudinaryError) {
        console.error('Error deleting image from Cloudinary:', cloudinaryError);
        // Don't fail the request if Cloudinary deletion fails - image is already removed from DB
        // Log the error but continue
      }
    }

    res.json({
      success: true,
      message: 'Image deleted successfully',
      data: {
        images: product.images,
      },
    });
  } catch (error) {
    console.error('Delete product image error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

/**
 * Upload product images to Cloudinary
 * @route POST /api/admin/products/upload-images
 */
export const uploadProductImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images provided',
      });
    }

    // Limit to 10 images
    if (req.files.length > 10) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 10 images allowed',
      });
    }

    // Convert files to base64 or use file paths
    // Multer stores files in req.files array
    const filePaths = req.files.map(file => {
      // Convert buffer to data URI for Cloudinary
      const base64 = file.buffer.toString('base64');
      return `data:${file.mimetype};base64,${base64}`;
    });

    // Upload to Cloudinary
    const uploadResults = await uploadMultipleImages(filePaths, 'ozme-products');

    // Extract URLs from results
    const imageUrls = uploadResults.map(result => result.url);

    res.json({
      success: true,
      message: 'Images uploaded successfully',
      data: {
        images: imageUrls,
      },
    });
  } catch (error) {
    console.error('Image upload error:', error);
    
    // Check if it's a Cloudinary configuration error
    if (error.message && error.message.includes('credentials not configured')) {
      return res.status(500).json({
        success: false,
        message: 'Cloudinary is not configured. Please check your .env file has CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET set.',
        error: error.message,
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload images to Cloudinary. Please check your Cloudinary credentials in .env file.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

