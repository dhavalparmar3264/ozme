import mongoose from 'mongoose';

/**
 * Policy Schema
 * @typedef {Object} Policy
 * @property {string} type - Policy type (privacy/refund/shipping/terms)
 * @property {string} title - Policy title
 * @property {string} content - Policy content (HTML or markdown)
 * @property {Date} lastUpdated - Last update date
 */
const policySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: [true, 'Policy type is required'],
      enum: ['privacy', 'refund', 'shipping', 'terms'],
      unique: true,
    },
    title: {
      type: String,
      required: [true, 'Policy title is required'],
    },
    content: {
      type: String,
      required: [true, 'Policy content is required'],
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Policy = mongoose.model('Policy', policySchema);

export default Policy;

