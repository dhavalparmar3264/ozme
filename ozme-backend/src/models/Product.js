import mongoose from 'mongoose';

/**
 * Product Schema
 * @typedef {Object} Product
 * @property {string} name - Product name
 * @property {string} shortDescription - Short product description (for cards)
 * @property {string} description - Full product description
 * @property {number} price - Product price (selling price)
 * @property {number} originalPrice - Original price/MRP (for discounts)
 * @property {string[]} images - Array of image URLs (max 10)
 * @property {string} category - Product category (from Category collection)
 * @property {string} gender - Target gender (Men/Women/Unisex)
 * @property {string} size - Product size (50ML, 120ML, 150ML, 200ML, 250ML, 300ML)
 * @property {number} rating - Average rating
 * @property {number} reviewsCount - Number of reviews
 * @property {string} tag - Product tag (Bestseller/New/Limited)
 * @property {boolean} inStock - Stock availability
 * @property {number} stockQuantity - Available stock quantity
 */
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    shortDescription: {
      type: String,
      trim: true,
      maxlength: [200, 'Short description cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: 0,
    },
    originalPrice: {
      type: Number,
      min: 0,
    },
    images: {
      type: [String],
      required: [true, 'At least one product image is required'],
    },
    category: {
      type: String,
      required: [true, 'Product category is required'],
      trim: true,
      // Category will be validated against Category collection
    },
    gender: {
      type: String,
      required: [true, 'Product gender is required'],
      enum: ['Men', 'Women', 'Unisex'],
    },
    size: {
      type: String,
      default: '120ML',
      enum: ['50ML', '120ML', '150ML', '200ML', '250ML', '300ML', '50 ml', '120 ml', '150 ml', '200 ml', '250 ml', '300 ml'],
    },
    sizes: {
      type: [
        {
          size: {
            type: String,
            enum: ['50ML', '120ML', '150ML', '200ML', '250ML', '300ML'],
            required: true,
          },
          price: {
            type: Number,
            required: true,
            min: 0,
          },
          originalPrice: {
            type: Number,
            min: 0,
          },
          stockQuantity: {
            type: Number,
            default: 0,
            min: 0,
          },
          inStock: {
            type: Boolean,
            default: true,
          },
        },
      ],
      default: undefined,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewsCount: {
      type: Number,
      default: 0,
    },
    tag: {
      type: String,
      enum: ['Bestseller', 'New', 'Limited'],
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    stockQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
    marketplace: {
      amazon: {
        type: Boolean,
        default: false,
      },
      flipkart: {
        type: Boolean,
        default: false,
      },
      myntra: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Validation: If sizes array is provided, it must have at least one item
productSchema.pre('validate', function (next) {
  if (this.sizes && Array.isArray(this.sizes)) {
    if (this.sizes.length === 0) {
      return next(new Error('Sizes array must contain at least one size'));
    }
    // Validate MRP >= Price for each size
    for (const sizeObj of this.sizes) {
      if (sizeObj.originalPrice && sizeObj.price && sizeObj.originalPrice < sizeObj.price) {
        return next(new Error(`MRP must be greater than or equal to selling price for size ${sizeObj.size}`));
      }
    }
  }
  next();
});

// Index for search and filtering
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, gender: 1, price: 1 });
// Performance index for dashboard low stock query
productSchema.index({ active: 1 });

const Product = mongoose.model('Product', productSchema);

export default Product;

