import mongoose from 'mongoose';

/**
 * FAQ Schema
 * @typedef {Object} Faq
 * @property {string} question - FAQ question
 * @property {string} answer - FAQ answer
 * @property {number} order - Display order
 */
const faqSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, 'Question is required'],
      trim: true,
    },
    answer: {
      type: String,
      required: [true, 'Answer is required'],
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Faq = mongoose.model('Faq', faqSchema);

export default Faq;

