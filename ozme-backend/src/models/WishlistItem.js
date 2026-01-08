import mongoose from 'mongoose';

/**
 * Wishlist Item Schema
 * @typedef {Object} WishlistItem
 * @property {ObjectId} user - Reference to User (or null for guest)
 * @property {string} guestToken - Guest session token (for non-logged users)
 * @property {ObjectId} product - Reference to Product
 */
const wishlistItemSchema = new mongoose.Schema(
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
  },
  {
    timestamps: true,
  }
);

// Ensure user OR guestToken is present
wishlistItemSchema.pre('validate', function (next) {
  if (!this.user && !this.guestToken) {
    next(new Error('Either user or guestToken must be provided'));
  } else {
    next();
  }
});

// Prevent duplicates
wishlistItemSchema.index({ user: 1, product: 1 }, { unique: true, sparse: true });
wishlistItemSchema.index({ guestToken: 1, product: 1 }, { unique: true, sparse: true });

const WishlistItem = mongoose.model('WishlistItem', wishlistItemSchema);

export default WishlistItem;

