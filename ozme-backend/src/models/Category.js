import mongoose from 'mongoose';

/**
 * Category Schema
 * @typedef {Object} Category
 * @property {string} name - Category name (unique)
 * @property {string} description - Category description
 * @property {boolean} active - Whether category is active
 */
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for search
categorySchema.index({ name: 'text', description: 'text' });

const Category = mongoose.model('Category', categorySchema);

export default Category;

