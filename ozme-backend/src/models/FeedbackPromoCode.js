import mongoose from 'mongoose';

/**
 * Feedback Promo Code Schema
 * User-specific, one-time use promo codes issued after feedback submission
 * @typedef {Object} FeedbackPromoCode
 * @property {string} code - Unique promo code (e.g., OZME10ABCD)
 * @property {ObjectId} userId - User who received this code
 * @property {string} email - User email (for tracking)
 * @property {string} phone - User phone (optional, for tracking)
 * @property {Date} issuedAt - When code was issued
 * @property {Date} expiresAt - When code expires (null = no expiry)
 * @property {boolean} isUsed - Whether code has been used
 * @property {Date} usedAt - When code was used (nullable)
 * @property {ObjectId} orderId - Order ID where code was used (nullable)
 * @property {string} source - Source of promo code (always "feedback")
 * @property {number} discountPercent - Discount percentage (default: 10)
 */
const feedbackPromoCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Promo code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: [8, 'Promo code must be at least 8 characters'],
      maxlength: [20, 'Promo code cannot exceed 20 characters'],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      index: true,
    },
    issuedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    expiresAt: {
      type: Date,
      default: null,
      index: true,
    },
    isUsed: {
      type: Boolean,
      default: false,
      index: true,
    },
    usedAt: {
      type: Date,
      default: null,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    source: {
      type: String,
      default: 'feedback',
      enum: ['feedback'],
    },
    discountPercent: {
      type: Number,
      default: 10,
      min: [1, 'Discount must be at least 1%'],
      max: [100, 'Discount cannot exceed 100%'],
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
feedbackPromoCodeSchema.index({ userId: 1, isUsed: 1 });
feedbackPromoCodeSchema.index({ code: 1, isUsed: 1 });
feedbackPromoCodeSchema.index({ email: 1, isUsed: 1 });

// Virtual: Check if code is expired (always false since no expiry)
feedbackPromoCodeSchema.virtual('isExpired').get(function () {
  return false; // No expiry for feedback promo codes
});

// Virtual: Check if code is valid (not used)
feedbackPromoCodeSchema.virtual('isValid').get(function () {
  return !this.isUsed;
});

// Method: Mark code as used
feedbackPromoCodeSchema.methods.markAsUsed = async function (orderId) {
  this.isUsed = true;
  this.usedAt = new Date();
  this.orderId = orderId;
  await this.save();
};

feedbackPromoCodeSchema.set('toJSON', { virtuals: true });

const FeedbackPromoCode = mongoose.model('FeedbackPromoCode', feedbackPromoCodeSchema);

export default FeedbackPromoCode;
