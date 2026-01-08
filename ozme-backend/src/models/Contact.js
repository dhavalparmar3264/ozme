import mongoose from 'mongoose';

/**
 * Contact Form Submission Schema
 * @typedef {Object} Contact
 * @property {string} name - Contact name
 * @property {string} email - Contact email
 * @property {string} phone - Contact phone
 * @property {string} category - Inquiry category
 * @property {string} message - Contact message
 * @property {boolean} isRead - Read status
 */
const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: ['general', 'order', 'product', 'feedback', 'other'],
      default: 'general',
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Contact = mongoose.model('Contact', contactSchema);

export default Contact;

