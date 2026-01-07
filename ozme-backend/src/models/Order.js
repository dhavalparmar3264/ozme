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
          default: '120ml',
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
    failureReason: {
      type: String,
      default: null, // e.g., 'TIMEOUT_PENDING_OVER_20_MIN', 'CANCELLED', 'EXPIRED', etc.
    },
    paymentId: {
      type: String,
      default: null, // Payment gateway transaction ID
    },
    paymentGateway: {
      type: String,
      enum: ['RAZORPAY', 'CASHFREE', 'PHONEPE'],
      default: null, // Payment gateway used
    },
    paymentMethodType: {
      type: String,
      default: null, // Payment method type: 'UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Wallet', etc.
    },
    merchantTransactionId: {
      type: String,
      default: null, // PhonePe merchant transaction ID
    },
    cashfreeOrderId: {
      type: String,
      default: null, // Cashfree order ID (for payment verification)
    },
    paidAt: {
      type: Date,
      default: null, // Payment completion timestamp
    },
    paymentInitiatedAt: {
      type: Date,
      default: null, // When payment was first initiated (for timeout calculation)
    },
    lastPaymentAttemptAt: {
      type: Date,
      default: null, // When last payment attempt was initiated (for retry timeout)
    },
    lastVerifiedAt: {
      type: Date,
      default: null, // Last time payment status was verified with Cashfree
    },
    paymentAttempts: [
      {
        attemptId: {
          type: String,
          required: true, // Unique attempt ID (e.g., timestamp-based)
        },
        cashfreeOrderId: {
          type: String,
          required: true, // Cashfree order ID for this attempt
        },
        paymentSessionId: {
          type: String,
          default: null, // Cashfree payment session ID
        },
        initiatedAt: {
          type: Date,
          required: true, // When this attempt was initiated
        },
        status: {
          type: String,
          enum: ['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'EXPIRED'],
          default: 'PENDING',
        },
        completedAt: {
          type: Date,
          default: null, // When attempt was completed (success/failure)
        },
      },
    ],
    orderStatus: {
      type: String,
      enum: ['Pending', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'],
      default: 'Pending',
    },
    // Delivery status tracking (synced with orderStatus)
    deliveryStatus: {
      type: String,
      enum: ['Pending', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'],
      default: 'Pending',
    },
    // Shipping information
    courierName: {
      type: String,
      default: null,
    },
    trackingNumber: {
      type: String,
      default: null,
    },
    // Delivery timestamps
    shippedAt: {
      type: Date,
      default: null,
    },
    outForDeliveryAt: {
      type: Date,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: 0,
    },
    subtotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    shippingCost: {
      type: Number,
      default: 0,
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
// Performance indexes for dashboard queries
orderSchema.index({ paymentStatus: 1, orderStatus: 1 });
orderSchema.index({ paymentMethod: 1, orderStatus: 1 });
orderSchema.index({ createdAt: -1 }); // For recent orders query

const Order = mongoose.model('Order', orderSchema);

export default Order;

