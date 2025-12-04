import mongoose from 'mongoose';

/**
 * Order Schema
 * @typedef {Object} Order
 * @property {ObjectId} user - Reference to User
 * @property {ObjectId[]} items - Array of order items (product references)
 * @property {Object} shippingAddress - Shipping address details
 * @property {string} paymentMethod - Payment method (COD/Prepaid)
 * @property {string} paymentStatus - Payment status (Pending/Paid/Failed)
 * @property {string} orderStatus - Order status (Pending/Processing/Shipped/Delivered/Cancelled)
 * @property {number} totalAmount - Total order amount
 * @property {number} discountAmount - Discount applied
 * @property {string} promoCode - Promo code used (if any)
 * @property {boolean} isMarketplace - Marketplace order flag
 * @property {string} trackingNumber - Order tracking number
 */
const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        size: {
          type: String,
          default: '100ml',
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],
    shippingAddress: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      country: { type: String, default: 'India' },
    },
    paymentMethod: {
      type: String,
      enum: ['COD', 'Prepaid'],
      required: [true, 'Payment method is required'],
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
      default: 'Pending',
    },
    paymentId: {
      type: String,
      default: null, // Razorpay payment ID for online payments
    },
    orderStatus: {
      type: String,
      enum: ['Pending', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'],
      default: 'Pending',
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    promoCode: {
      type: String,
      default: null,
    },
    isMarketplace: {
      type: Boolean,
      default: false,
    },
    trackingNumber: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Generate order number
orderSchema.virtual('orderNumber').get(function () {
  return `OZME-${this._id.toString().slice(-8).toUpperCase()}`;
});

orderSchema.set('toJSON', { virtuals: true });

// Indexes
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ trackingNumber: 1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;

