import mongoose from 'mongoose';

/**
 * Feedback Schema
 * @typedef {Object} Feedback
 * @property {string} longevity - How long the fragrance lasted (2-4 hours, 4-6 hours, 6-8 hours, 8+ hours)
 * @property {string} projection - How strong the fragrance was (Soft/close to skin, Moderate, Strong)
 * @property {string} fragrance_satisfaction - Satisfaction level (Loved it, Good, Okay, Not for me)
 * @property {string} packaging - Packaging experience (Excellent, Good, Average, Poor)
 * @property {string} delivery - Delivery experience (On time, Slightly delayed, Delayed)
 * @property {string} recommend - Would recommend OZME (Yes, Maybe, No)
 * @property {string} order_ref - Optional order ID / Phone / Email
 * @property {string} note - Optional feedback note (max 200 chars)
 * @property {string} ip_address - IP address for rate limiting
 * @property {Date} created_at - Timestamp
 */
const feedbackSchema = new mongoose.Schema(
  {
    longevity: {
      type: String,
      required: [true, 'Longevity is required'],
      enum: ['2-4 hours', '4-6 hours', '6-8 hours', '8+ hours'],
    },
    projection: {
      type: String,
      enum: ['Soft / close to skin', 'Moderate', 'Strong'],
    },
    fragrance_satisfaction: {
      type: String,
      required: [true, 'Fragrance satisfaction is required'],
      enum: ['Loved it', 'Good', 'Okay', 'Not for me'],
    },
    packaging: {
      type: String,
      required: [true, 'Packaging experience is required'],
      enum: ['Excellent', 'Good', 'Average', 'Poor'],
    },
    delivery: {
      type: String,
      enum: ['On time', 'Slightly delayed', 'Delayed'],
    },
    recommend: {
      type: String,
      enum: ['Yes', 'Maybe', 'No'],
    },
    order_ref: {
      type: String,
      trim: true,
      maxlength: [100, 'Order reference cannot exceed 100 characters'],
    },
    note: {
      type: String,
      trim: true,
      maxlength: [200, 'Note cannot exceed 200 characters'],
    },
    ip_address: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false, // Don't track updates
  }
);

// Index for rate limiting queries
feedbackSchema.index({ ip_address: 1, created_at: -1 });

const Feedback = mongoose.model('Feedback', feedbackSchema);

export default Feedback;

