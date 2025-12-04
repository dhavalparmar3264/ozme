import Order from '../models/Order.js';
import CartItem from '../models/CartItem.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import { sendOrderConfirmationEmail } from '../utils/orderEmails.js';

/**
 * Create order from cart
 * @route POST /api/orders
 */
export const createOrder = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod, promoCode, discountAmount = 0 } = req.body;

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Get cart items
    const cartItems = await CartItem.find({ user: req.user.id }).populate('product');

    if (cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty',
      });
    }

    // Calculate total
    let totalAmount = cartItems.reduce((sum, item) => {
      return sum + item.product.price * item.quantity;
    }, 0);

    // Track coupon usage if provided
    if (promoCode && discountAmount > 0) {
      const coupon = await Coupon.findOne({ code: promoCode.toUpperCase() });
      if (coupon) {
        await coupon.markAsUsed(req.user.id);
      }
    }

    totalAmount -= discountAmount;

    // Create order
    const order = await Order.create({
      user: req.user.id,
      items: cartItems.map((item) => ({
        product: item.product._id,
        quantity: item.quantity,
        size: item.size,
        price: item.product.price,
      })),
      shippingAddress,
      paymentMethod: paymentMethod || 'COD',
      orderStatus: paymentMethod === 'COD' ? 'Processing' : 'Pending',
      totalAmount,
      discountAmount,
      promoCode: promoCode || null,
    });

    // Clear cart
    await CartItem.deleteMany({ user: req.user.id });

    await order.populate('items.product user');

    // Send confirmation email for COD orders
    if (paymentMethod === 'COD') {
      await sendOrderConfirmationEmail(order, order.user);
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        order: {
          ...order.toJSON(),
          orderNumber: order.orderNumber,
        }
      },
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

/**
 * Get order by ID
 * @route GET /api/orders/:id
 */
export const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.product').populate('user', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check if user owns the order or is admin
    if (req.user && req.user.id !== order.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    res.json({
      success: true,
      data: { order },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

/**
 * Get user's orders
 * @route GET /api/orders/user
 */
export const getUserOrders = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const orders = await Order.find({ user: req.user.id })
      .populate('items.product')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { orders },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

/**
 * Track order by tracking number or order ID
 * @route GET /api/orders/track/:identifier
 */
export const trackOrder = async (req, res) => {
  try {
    const { identifier } = req.params;

    const order = await Order.findOne({
      $or: [
        { _id: identifier },
        { trackingNumber: identifier },
      ],
    }).populate('items.product');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    res.json({
      success: true,
      data: { order },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

