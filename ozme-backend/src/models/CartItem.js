import mongoose from 'mongoose';

/**
 * Cart Item Schema
 * @typedef {Object} CartItem
 * @property {ObjectId} user - Reference to User (or null for guest)
 * @property {string} guestToken - Guest session token (for non-logged users)
 * @property {ObjectId} product - Reference to Product
 * @property {number} quantity - Item quantity
 * @property {string} size - Product size (default: 120ml)
 */
const cartItemSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    guestToken: {
      type: String,
      default: null,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: 1,
      default: 1,
    },
    size: {
      type: String,
      default: '120ml',
    },
  },
  {
    timestamps: true,
  }
);

// Ensure user OR guestToken is present
cartItemSchema.pre('validate', function (next) {
  if (!this.user && !this.guestToken) {
    next(new Error('Either user or guestToken must be provided'));
  } else {
    next();
  }
});

// Compound index for efficient queries
cartItemSchema.index({ user: 1, product: 1, size: 1 });
cartItemSchema.index({ guestToken: 1, product: 1, size: 1 });

const CartItem = mongoose.model('CartItem', cartItemSchema);

export default CartItem;

