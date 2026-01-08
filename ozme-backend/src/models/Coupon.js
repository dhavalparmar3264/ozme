import mongoose from 'mongoose';

/**
 * Coupon Schema
 * @typedef {Object} Coupon
 * @property {string} code - Unique coupon code
 * @property {string} type - Discount type (Percentage/Fixed Amount)
 * @property {number} value - Discount value
 * @property {number} minOrder - Minimum order amount required
 * @property {number} maxDiscount - Maximum discount cap (for percentage)
 * @property {number} usageLimit - Total usage limit for coupon
 * @property {number} usedCount - Number of times used
 * @property {number} perUserLimit - Usage limit per user
 * @property {Date} expiryDate - Coupon expiry date
 * @property {string} status - Active/Inactive
 * @property {string} description - Coupon description
 */
const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: [3, 'Coupon code must be at least 3 characters'],
      maxlength: [50, 'Coupon code cannot exceed 50 characters'],
    },
    type: {
      type: String,
      enum: ['Percentage', 'Fixed Amount'],
      required: [true, 'Discount type is required'],
    },
    value: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: [0, 'Value cannot be negative'],
    },
    minOrder: {
      type: Number,
      required: [true, 'Minimum order amount is required'],
      min: [0, 'Minimum order cannot be negative'],
      default: 0,
    },
    maxDiscount: {
      type: Number,
      required: [true, 'Maximum discount is required'],
      min: [0, 'Maximum discount cannot be negative'],
    },
    usageLimit: {
      type: Number,
      required: [true, 'Usage limit is required'],
      min: [1, 'Usage limit must be at least 1'],
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    perUserLimit: {
      type: Number,
      default: 1,
      min: [1, 'Per user limit must be at least 1'],
    },
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required'],
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
    description: {
      type: String,
      default: '',
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    // Track which users have used this coupon
    usedBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        count: {
          type: Number,
          default: 1,
        },
        lastUsed: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Check if coupon is expired
couponSchema.virtual('isExpired').get(function () {
  return new Date() > this.expiryDate;
});

// Check if coupon is available
couponSchema.virtual('isAvailable').get(function () {
  return (
    this.status === 'Active' &&
    !this.isExpired &&
    this.usedCount < this.usageLimit
  );
});

// Calculate discount amount
couponSchema.methods.calculateDiscount = function (orderAmount) {
  if (orderAmount < this.minOrder) {
    return 0;
  }

  let discount = 0;
  if (this.type === 'Percentage') {
    discount = (orderAmount * this.value) / 100;
    // Apply max discount cap
    if (discount > this.maxDiscount) {
      discount = this.maxDiscount;
    }
  } else {
    // Fixed Amount
    discount = this.value;
  }

  // Discount cannot exceed order amount
  return Math.min(discount, orderAmount);
};

// Check if user can use this coupon
couponSchema.methods.canUserUse = function (userId) {
  const userUsage = this.usedBy.find(
    (u) => u.user.toString() === userId.toString()
  );
  
  if (!userUsage) {
    return true; // User hasn't used this coupon
  }
  
  return userUsage.count < this.perUserLimit;
};

// Mark coupon as used by user
couponSchema.methods.markAsUsed = async function (userId) {
  const userUsage = this.usedBy.find(
    (u) => u.user.toString() === userId.toString()
  );

  if (userUsage) {
    userUsage.count += 1;
    userUsage.lastUsed = new Date();
  } else {
    this.usedBy.push({
      user: userId,
      count: 1,
      lastUsed: new Date(),
    });
  }

  this.usedCount += 1;
  await this.save();
};

couponSchema.set('toJSON', { virtuals: true });

// Indexes
// Note: code field already has unique: true which creates an index, so we don't need to create it again
couponSchema.index({ status: 1, expiryDate: 1 });

const Coupon = mongoose.model('Coupon', couponSchema);

export default Coupon;
