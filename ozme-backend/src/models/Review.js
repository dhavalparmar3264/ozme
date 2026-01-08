import mongoose from 'mongoose';

/**
 * Review Schema
 * @typedef {Object} Review
 * @property {ObjectId} user - Reference to User
 * @property {ObjectId} product - Reference to Product
 * @property {number} rating - Rating (1-5)
 * @property {string} comment - Review comment
 * @property {string} userName - User's name (for display)
 * @property {string} status - Review status (Pending, Approved, Hidden)
 */
const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
    },
    userName: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Hidden'],
      default: 'Pending',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate reviews
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

// Index for efficient filtering by status
reviewSchema.index({ status: 1 });

// Index for product reviews lookup
reviewSchema.index({ product: 1, status: 1 });

const Review = mongoose.model('Review', reviewSchema);

export default Review;

