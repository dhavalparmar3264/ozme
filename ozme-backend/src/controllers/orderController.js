import mongoose from 'mongoose';
import Order from '../models/Order.js';
import CartItem from '../models/CartItem.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import User from '../models/User.js';
import { sendOrderConfirmationEmail, sendAdminOrderNotification } from '../utils/orderEmails.js';
import { subscribeNewsletter } from './newsletterController.js';

/**
 * Helper function to reduce product stock for order items
 * @param {Array} orderItems - Array of order items with product, quantity, and size
 * @returns {Promise<void>}
 */
const reduceOrderStock = async (orderItems) => {
  for (const orderItem of orderItems) {
    const product = await Product.findById(orderItem.product);
    if (!product) {
      throw new Error(`Product with ID ${orderItem.product} not found`);
    }

    const orderedSize = orderItem.size || '120ML';
    const orderedQuantity = orderItem.quantity || 1;

    // Check if product has sizes array
    if (product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0) {
      // Find the size in the sizes array
      const sizeIndex = product.sizes.findIndex(s => 
        s.size && s.size.toUpperCase() === orderedSize.toUpperCase()
      );

      if (sizeIndex === -1) {
        throw new Error(`Size ${orderedSize} not available for product ${product.name}`);
      }

      const currentStock = product.sizes[sizeIndex].stockQuantity || 0;
      
      // Check if enough stock available
      if (currentStock < orderedQuantity) {
        throw new Error(`Insufficient stock for ${product.name} (${orderedSize}). Available: ${currentStock}, Requested: ${orderedQuantity}`);
      }

      // Reduce stock for the specific size
      product.sizes[sizeIndex].stockQuantity = currentStock - orderedQuantity;
      product.sizes[sizeIndex].inStock = (currentStock - orderedQuantity) > 0;

      // Update product-level stock quantity (sum of all sizes)
      product.stockQuantity = product.sizes.reduce((sum, s) => sum + (s.stockQuantity || 0), 0);
      product.inStock = product.sizes.some(s => s.inStock !== false && (s.stockQuantity || 0) > 0);
    } else {
      // Handle single size product (backward compatibility)
      const currentStock = product.stockQuantity || 0;
      
      // Check if enough stock available
      if (currentStock < orderedQuantity) {
        throw new Error(`Insufficient stock for ${product.name}. Available: ${currentStock}, Requested: ${orderedQuantity}`);
      }

      // Reduce stock
      product.stockQuantity = currentStock - orderedQuantity;
      product.inStock = product.stockQuantity > 0;
    }

    // Save updated product
    await product.save();
  }
};

/**
 * Create order from cart
 * @route POST /api/orders
 */
export const createOrder = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod, promoCode, discountAmount = 0, items: requestItems, totalAmount: requestTotalAmount, newsletter } = req.body;

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    let orderItems = [];
    let totalAmount = 0;

    // If items are provided directly in request, use those (for localStorage carts)
    if (requestItems && Array.isArray(requestItems) && requestItems.length > 0) {
      // Validate and map items from request
      for (const item of requestItems) {
        if (!item.productId) {
          return res.status(400).json({
            success: false,
            message: 'Each item must have a productId',
          });
        }

        // Verify product exists - handle both ObjectId and string IDs
        let product = null;
        
        // Check if productId is a valid MongoDB ObjectId
        const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(item.productId?.toString());
        
        if (isValidObjectId) {
          product = await Product.findById(item.productId);
        } else {
          // If not a valid ObjectId, try to find by other means or return error
          return res.status(400).json({
            success: false,
            message: `Invalid product ID format: ${item.productId}. Product ID must be a valid MongoDB ObjectId.`,
          });
        }
        
        if (!product) {
          return res.status(400).json({
            success: false,
            message: `Product with ID ${item.productId} not found`,
          });
        }

        orderItems.push({
          product: item.productId,
          quantity: item.quantity || 1,
          size: item.size || '120ml',
          price: item.price || product.price, // Use provided price or product price
        });

        totalAmount += (item.price || product.price) * (item.quantity || 1);
      }
    } else {
      // Get cart items from backend (original behavior)
      const cartItems = await CartItem.find({ user: req.user.id }).populate('product');

      if (cartItems.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Cart is empty',
        });
      }

      // Map cart items to order items
      orderItems = cartItems.map((item) => ({
        product: item.product._id,
        quantity: item.quantity,
        size: item.size,
        price: item.product.price,
      }));

      // Calculate total from cart
      totalAmount = cartItems.reduce((sum, item) => {
        return sum + item.product.price * item.quantity;
      }, 0);
    }

    // Track coupon usage if provided
    if (promoCode && discountAmount > 0) {
      const coupon = await Coupon.findOne({ code: promoCode.toUpperCase() });
      if (coupon) {
        await coupon.markAsUsed(req.user.id);
      }
    }

    // Use request total amount if provided (for cases with discounts already applied)
    if (requestTotalAmount !== undefined) {
      totalAmount = requestTotalAmount;
    } else {
      totalAmount -= discountAmount;
    }

    // Format shipping address (combine firstName and lastName into name if needed)
    const formattedShippingAddress = {
      name: shippingAddress.name || `${shippingAddress.firstName || ''} ${shippingAddress.lastName || ''}`.trim() || 'Customer',
      phone: shippingAddress.phone || '',
      address: shippingAddress.address || shippingAddress.street || '',
      city: shippingAddress.city || '',
      state: shippingAddress.state || '',
      pincode: shippingAddress.pincode || shippingAddress.pinCode || '',
      country: shippingAddress.country || 'India',
    };

    // Check stock availability and reduce stock for COD orders (confirmed immediately)
    // For online payments, stock will be reduced after payment verification (when confirmed)
    const isCOD = paymentMethod === 'COD' || (!paymentMethod || paymentMethod.toUpperCase() === 'COD');
    
    if (isCOD) {
      // COD orders are confirmed immediately - reduce stock now
      try {
        await reduceOrderStock(orderItems);
      } catch (stockError) {
        return res.status(400).json({
          success: false,
          message: stockError.message || 'Stock reduction failed',
        });
      }
    } else {
      // For online payments, just check stock availability (don't reduce until payment confirmed)
      for (const orderItem of orderItems) {
        const product = await Product.findById(orderItem.product);
        if (!product) {
          return res.status(400).json({
            success: false,
            message: `Product with ID ${orderItem.product} not found`,
          });
        }

        const orderedSize = orderItem.size || '120ML';
        const orderedQuantity = orderItem.quantity || 1;

        // Check if product has sizes array
        if (product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0) {
          const sizeIndex = product.sizes.findIndex(s => 
            s.size && s.size.toUpperCase() === orderedSize.toUpperCase()
          );

          if (sizeIndex === -1) {
            return res.status(400).json({
              success: false,
              message: `Size ${orderedSize} not available for product ${product.name}`,
            });
          }

          const currentStock = product.sizes[sizeIndex].stockQuantity || 0;
          
          if (currentStock < orderedQuantity) {
            return res.status(400).json({
              success: false,
              message: `Insufficient stock for ${product.name} (${orderedSize}). Available: ${currentStock}, Requested: ${orderedQuantity}`,
            });
          }
        } else {
          const currentStock = product.stockQuantity || 0;
          
          if (currentStock < orderedQuantity) {
            return res.status(400).json({
              success: false,
              message: `Insufficient stock for ${product.name}. Available: ${currentStock}, Requested: ${orderedQuantity}`,
            });
          }
        }
      }
    }

    // Calculate subtotal and shipping cost
    const subtotal = totalAmount + discountAmount; // Subtotal before discount
    const shippingCost = 0; // Free shipping for now

    // Create order
    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      shippingAddress: formattedShippingAddress,
      paymentMethod: paymentMethod === 'ONLINE' ? 'Prepaid' : (paymentMethod || 'COD'),
      orderStatus: paymentMethod === 'ONLINE' ? 'Pending' : (paymentMethod === 'COD' ? 'Processing' : 'Pending'),
      deliveryStatus: paymentMethod === 'ONLINE' ? 'Pending' : (paymentMethod === 'COD' ? 'Processing' : 'Pending'),
      totalAmount,
      subtotal,
      shippingCost,
      discountAmount,
      promoCode: promoCode || null,
    });

    // Clear cart after successful order creation (for both backend cart and requestItems)
    try {
      // Clear backend cart items
      await CartItem.deleteMany({ user: req.user.id });
      console.log(`✅ Cart cleared for user ${req.user.id} after order creation`);
    } catch (cartError) {
      console.error('⚠️  Error clearing cart:', cartError.message);
      // Don't fail order creation if cart clearing fails
    }

    await order.populate('items.product user');

    console.log(`📦 Order created successfully: ${order.orderNumber} (${order._id})`);
    console.log(`   Customer: ${order.user?.email || order.shippingAddress?.email || 'N/A'}`);
    console.log(`   Payment Method: ${order.paymentMethod}`);
    console.log(`   Total Amount: ₹${order.totalAmount}`);

    // Save delivery address to user's addresses (non-blocking)
    try {
      if (req.user && shippingAddress) {
        const user = await User.findById(req.user.id);
        if (user) {
          // Prepare address data
          const addressData = {
            firstName: shippingAddress.firstName || shippingAddress.name?.split(' ')[0] || '',
            lastName: shippingAddress.lastName || shippingAddress.name?.split(' ').slice(1).join(' ') || '',
            email: shippingAddress.email || order.user?.email || user.email || '',
            phone: shippingAddress.phone || '',
            street: shippingAddress.street || shippingAddress.address || '',
            apartment: shippingAddress.apartment || '',
            city: shippingAddress.city || '',
            state: shippingAddress.state || '',
            pinCode: shippingAddress.pinCode || shippingAddress.pincode || '',
            country: shippingAddress.country || 'India',
            isDefault: false, // Will be set to true after saving
            createdAt: new Date(),
          };

          // Check if address already exists (compare key fields)
          const existingAddress = user.addresses.find(addr => 
            addr.street?.toLowerCase().trim() === addressData.street.toLowerCase().trim() &&
            addr.city?.toLowerCase().trim() === addressData.city.toLowerCase().trim() &&
            addr.state?.toLowerCase().trim() === addressData.state.toLowerCase().trim() &&
            addr.pinCode?.trim() === addressData.pinCode.trim()
          );

          if (!existingAddress) {
            // Set all other addresses to not default
            user.addresses.forEach(addr => {
              addr.isDefault = false;
            });
            
            // Set new address as default
            addressData.isDefault = true;
            
            // Add new address
            user.addresses.push(addressData);
            await user.save();
            
            console.log(`✅ Address saved to user profile for order ${order.orderNumber}`);
          } else {
            // Address exists, just set it as default
            user.addresses.forEach(addr => {
              addr.isDefault = addr._id.toString() === existingAddress._id.toString();
            });
            await user.save();
            
            console.log(`ℹ️  Address already exists, set as default for order ${order.orderNumber}`);
          }
        }
      }
    } catch (addressError) {
      console.error(`⚠️  Failed to save address for order ${order.orderNumber}:`, addressError.message);
      // Don't fail the order if address save fails
    }

    // Handle newsletter subscription if checkbox was checked (non-blocking)
    if (newsletter && shippingAddress?.email) {
      try {
        // Import NewsletterSubscriber model
        const NewsletterSubscriber = (await import('../models/NewsletterSubscriber.js')).default;
        const normalizedEmail = shippingAddress.email.trim().toLowerCase();
        
        // Check if already subscribed
        let subscriber = await NewsletterSubscriber.findOne({ email: normalizedEmail });
        if (!subscriber) {
          subscriber = await NewsletterSubscriber.create({ email: normalizedEmail });
          console.log(`📧 Newsletter subscription created for ${normalizedEmail}`);
        } else {
          console.log(`ℹ️  Email ${normalizedEmail} already subscribed to newsletter`);
        }
      } catch (newsletterError) {
        console.error(`⚠️  Newsletter subscription error:`, newsletterError.message);
        // Don't fail the order if newsletter subscription fails
      }
    }

    // Send admin notification email for ALL orders (non-blocking)
    try {
      console.log(`📤 Sending admin order notification for order ${order.orderNumber}...`);
      const adminEmailResult = await sendAdminOrderNotification(order);
      if (adminEmailResult.success) {
        console.log(`✅ Admin notification email sent successfully for order ${order.orderNumber}`);
      } else {
        console.error(`❌ Admin notification email failed for order ${order.orderNumber}:`, adminEmailResult.error || adminEmailResult.message);
      }
    } catch (emailError) {
      console.error(`❌ Exception sending admin order notification for order ${order.orderNumber}:`, {
        message: emailError.message,
        stack: emailError.stack,
        error: emailError
      });
      // Don't fail the order if email fails
    }

    // Send customer confirmation email for COD orders immediately
    // For Prepaid/Online orders, emails will be sent after payment verification in paymentController
    if (paymentMethod === 'COD' || (!paymentMethod || paymentMethod.toUpperCase() === 'COD')) {
      try {
        console.log(`📤 Sending customer confirmation email for order ${order.orderNumber}...`);
        const customerEmailResult = await sendOrderConfirmationEmail(order, order.user);
        if (customerEmailResult.success) {
          console.log(`✅ Customer confirmation email sent successfully for order ${order.orderNumber}`);
        } else {
          console.error(`❌ Customer confirmation email failed for order ${order.orderNumber}:`, customerEmailResult.error || customerEmailResult.message);
        }
      } catch (emailError) {
        console.error(`❌ Exception sending customer confirmation email for order ${order.orderNumber}:`, {
          message: emailError.message,
          stack: emailError.stack,
          error: emailError
        });
        // Don't fail the order if email fails
      }
    } else {
      console.log(`ℹ️  Customer confirmation email will be sent after payment verification for order ${order.orderNumber}`);
    }
    // Note: Prepaid orders will have customer emails sent in paymentController after payment verification

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

    // Log database connection info (for debugging)
    const db = mongoose.connection.db;
    const dbName = db?.databaseName || 'unknown';
    const dbHost = mongoose.connection.host || 'unknown';
    console.log(`[getUserOrders] Querying DB: ${dbHost}/${dbName} for user: ${req.user.id} (${req.user.email})`);

    const orders = await Order.find({ user: req.user.id })
      .populate('items.product')
      .sort({ createdAt: -1 });

    console.log(`[getUserOrders] Found ${orders.length} orders for user ${req.user.email}`);

    res.json({
      success: true,
      data: { orders },
    });
  } catch (error) {
    console.error('[getUserOrders] Error:', error);
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
/**
 * Get payment status for an order (with Cashfree verification)
 * @route GET /api/orders/:orderId/payment-status
 */
export const getOrderPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required',
      });
    }

    // Find order
    const order = await Order.findById(orderId).populate('user');
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check if user owns the order (if authenticated)
    if (req.user && req.user.id !== order.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // For COD orders, return current status
    if (order.paymentMethod === 'COD') {
      return res.json({
        success: true,
        data: {
          orderId: order._id.toString(),
          orderStatus: order.orderStatus,
          paymentMethod: 'COD',
          paymentStatus: 'PENDING', // COD is always pending until delivery
          paymentProvider: null,
          cashfreeOrderId: null,
          lastVerifiedAt: null,
          canRetryPayment: false,
        },
      });
    }

    // For online payments, verify with Cashfree if needed
    let paymentStatus = order.paymentStatus || 'Pending';
    let cashfreeOrderId = order.cashfreeOrderId;
    let lastVerifiedAt = order.lastVerifiedAt;

    // If payment is already confirmed, return immediately
    if (paymentStatus === 'Paid') {
      return res.json({
        success: true,
        data: {
          orderId: order._id.toString(),
          orderStatus: order.orderStatus,
          paymentMethod: 'Online Payment',
          paymentStatus: 'SUCCESS',
          paymentProvider: order.paymentGateway || 'CASHFREE',
          cashfreeOrderId: cashfreeOrderId,
          lastVerifiedAt: lastVerifiedAt,
          canRetryPayment: false,
        },
      });
    }

    // CRITICAL: Check for 20-minute timeout for PENDING payments
    // Use lastPaymentAttemptAt (or paymentInitiatedAt as fallback) instead of order.createdAt
    const now = new Date();
    const paymentAttemptTime = order.lastPaymentAttemptAt || order.paymentInitiatedAt || order.createdAt;
    const timeSinceAttempt = now - paymentAttemptTime;
    const TWENTY_MINUTES_MS = 20 * 60 * 1000;

    // If payment is PENDING and >20 minutes old since last attempt, mark as FAILED (timeout)
    if (paymentStatus === 'Pending' && timeSinceAttempt > TWENTY_MINUTES_MS) {
      // IDEMPOTENT: Only update if not already failed
      if (order.paymentStatus !== 'Failed') {
        console.log(`[getOrderPaymentStatus] Payment timeout: Order ${orderId} pending for ${Math.round(timeSinceAttempt / 60000)} minutes since last attempt, marking as FAILED`);
        order.paymentStatus = 'Failed';
        order.failureReason = 'TIMEOUT_PENDING_OVER_20_MIN';
        
        // Mark current pending attempt as failed
        if (order.paymentAttempts && order.paymentAttempts.length > 0) {
          const lastAttempt = order.paymentAttempts[order.paymentAttempts.length - 1];
          if (lastAttempt.status === 'PENDING') {
            lastAttempt.status = 'FAILED';
            lastAttempt.completedAt = now;
          }
        }
        
        await order.save();
        
        return res.json({
          success: true,
          data: {
            orderId: order._id.toString(),
            orderStatus: order.orderStatus,
            paymentMethod: 'Online Payment',
            paymentStatus: 'FAILED',
            paymentProvider: order.paymentGateway || 'CASHFREE',
            cashfreeOrderId: cashfreeOrderId,
            lastVerifiedAt: now,
            failureReason: 'TIMEOUT_PENDING_OVER_20_MIN',
            canRetryPayment: true,
            timeElapsedMinutes: Math.round(timeSinceAttempt / 60000),
            nextCheckAt: null, // No need to check again
          },
        });
      }
    }

    // If we have a cashfreeOrderId and payment is still pending (and not timed out), verify with Cashfree
    if (cashfreeOrderId && paymentStatus === 'Pending' && timeSinceAttempt <= TWENTY_MINUTES_MS) {
      // Throttle verification: Don't call Cashfree more than once per 30 seconds
      // Return nextCheckAt to frontend so it can align polling
      const THROTTLE_MS = 30000; // 30 seconds
      const shouldVerify = !lastVerifiedAt || (now - new Date(lastVerifiedAt)) > THROTTLE_MS;
      const nextCheckAt = lastVerifiedAt 
        ? new Date(new Date(lastVerifiedAt).getTime() + THROTTLE_MS)
        : now;

      if (shouldVerify) {
        try {
          const { verifyCashfreeOrderStatus } = await import('../utils/cashfree.js');
          const cashfreeStatus = await verifyCashfreeOrderStatus(cashfreeOrderId);

          // Map Cashfree status to our payment status
          let newPaymentStatus = paymentStatus;
          let newOrderStatus = order.orderStatus;
          let failureReason = order.failureReason;

          if (cashfreeStatus.orderStatus === 'PAID' || cashfreeStatus.paymentStatus === 'SUCCESS') {
            // IDEMPOTENT: Only update if not already paid (prevent reverting successful payments)
            if (order.paymentStatus !== 'Paid') {
              newPaymentStatus = 'Paid';
              if (order.orderStatus === 'Pending') {
                newOrderStatus = 'Processing';
              }
              order.paidAt = new Date();
              order.failureReason = null; // Clear failure reason on success
            }
          } else if (cashfreeStatus.orderStatus === 'EXPIRED' || cashfreeStatus.paymentStatus === 'FAILED' || cashfreeStatus.paymentStatus === 'CANCELLED') {
            // IDEMPOTENT: Only update if not already failed (prevent overwriting timeout failures)
            if (order.paymentStatus !== 'Failed') {
              newPaymentStatus = 'Failed';
              failureReason = cashfreeStatus.orderStatus === 'EXPIRED' ? 'EXPIRED' : 
                            cashfreeStatus.paymentStatus === 'CANCELLED' ? 'CANCELLED' : 'FAILED';
              order.failureReason = failureReason;
            }
          }

          // Update order if status changed
          if (newPaymentStatus !== paymentStatus || newOrderStatus !== order.orderStatus) {
            order.paymentStatus = newPaymentStatus;
            order.orderStatus = newOrderStatus;
            order.deliveryStatus = newOrderStatus; // Sync delivery status
            order.lastVerifiedAt = now;
            await order.save();

            // If payment is confirmed, reduce stock
            if (newPaymentStatus === 'Paid' && order.orderStatus === 'Processing') {
              try {
                await reduceOrderStock(order.items);
              } catch (stockError) {
                console.error('Error reducing stock after payment confirmation:', stockError);
              }
            }

            paymentStatus = newPaymentStatus;
            lastVerifiedAt = now;
          } else {
            // Update lastVerifiedAt even if status didn't change
            order.lastVerifiedAt = now;
            await order.save();
            lastVerifiedAt = now;
          }
        } catch (verifyError) {
          console.error('Error verifying Cashfree order status:', verifyError);
          // Continue with current DB status if verification fails
        }
      }
    }

    // Map payment status to API format
    const apiPaymentStatus = paymentStatus === 'Paid' ? 'SUCCESS' : 
                            paymentStatus === 'Failed' ? 'FAILED' : 'PENDING';

    // Calculate remaining time for pending payments (based on last attempt, not order creation)
    const remainingMinutes = paymentStatus === 'Pending' && timeSinceAttempt < TWENTY_MINUTES_MS
      ? Math.max(0, Math.ceil((TWENTY_MINUTES_MS - timeSinceAttempt) / 60000))
      : null;

    // Calculate nextCheckAt for frontend polling alignment
    const THROTTLE_MS = 30000; // 30 seconds
    const nextCheckAt = paymentStatus === 'Pending' && lastVerifiedAt
      ? new Date(new Date(lastVerifiedAt).getTime() + THROTTLE_MS)
      : null;

    return res.json({
      success: true,
      data: {
        orderId: order._id.toString(),
        orderStatus: order.orderStatus,
        paymentMethod: 'Online Payment',
        paymentStatus: apiPaymentStatus,
        paymentProvider: order.paymentGateway || 'CASHFREE',
        cashfreeOrderId: cashfreeOrderId,
        lastVerifiedAt: lastVerifiedAt,
        failureReason: order.failureReason || null,
        canRetryPayment: apiPaymentStatus === 'FAILED' || (apiPaymentStatus === 'PENDING' && timeSinceAttempt > TWENTY_MINUTES_MS),
        remainingMinutes: remainingMinutes,
        timeElapsedMinutes: Math.round(timeSinceAttempt / 60000),
        nextCheckAt: nextCheckAt ? nextCheckAt.toISOString() : null, // Frontend should poll at this time
        lastPaymentAttemptAt: order.lastPaymentAttemptAt ? order.lastPaymentAttemptAt.toISOString() : null,
      },
    });
  } catch (error) {
    console.error('Get order payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment status',
      error: error.message,
    });
  }
};

/**
 * Retry payment for a failed/pending order
 * @route POST /api/orders/:orderId/retry-payment
 */
export const retryOrderPayment = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required',
      });
    }

    // Find order
    const order = await Order.findById(orderId).populate('user');
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check if user owns the order (must be authenticated)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (req.user.id !== order.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Preconditions: Only allow retry when paymentStatus !== Paid and order not cancelled
    if (order.paymentStatus === 'Paid') {
      return res.status(400).json({
        success: false,
        message: 'Payment already successful. Cannot retry payment.',
      });
    }

    if (order.orderStatus === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Order is cancelled. Cannot retry payment.',
      });
    }

    // Only allow retry for online payments
    if (order.paymentMethod !== 'Prepaid') {
      return res.status(400).json({
        success: false,
        message: 'Retry payment is only available for online payments.',
      });
    }

    // Prevent rapid retries: Check if last attempt was less than 10 seconds ago
    const now = new Date();
    if (order.lastPaymentAttemptAt) {
      const timeSinceLastAttempt = now - order.lastPaymentAttemptAt;
      if (timeSinceLastAttempt < 10000) { // 10 seconds
        return res.status(429).json({
          success: false,
          message: 'Please wait a few seconds before retrying payment.',
          retryAfter: Math.ceil((10000 - timeSinceLastAttempt) / 1000),
        });
      }
    }

    // Create new Cashfree payment session
    const { createCashfreePaymentSession } = await import('../utils/cashfree.js');
    
    const customerDetails = {
      name: order.shippingAddress?.name || order.user?.name || 'Customer',
      email: order.shippingAddress?.email || order.user?.email || '',
      phone: order.shippingAddress?.phone || order.user?.phone || '',
      customerId: order.user?._id?.toString() || `customer_${orderId}`,
    };

    const orderMeta = {
      returnUrl: `${process.env.CLIENT_URL || 'https://ozme.in'}/checkout/success?order_id={order_id}`,
      notifyUrl: `${process.env.API_BASE_URL || 'https://www.ozme.in'}/api/payments/cashfree/webhook`,
    };

    // Generate unique attempt ID
    const attemptId = `attempt_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    console.log(`[retryOrderPayment] Creating new payment session for order ${orderId}, attemptId: ${attemptId}`);
    const paymentSession = await createCashfreePaymentSession(
      order.totalAmount,
      `${orderId}_${attemptId}`, // Include attemptId in order_id for Cashfree
      customerDetails,
      orderMeta
    );

    // Mark old pending attempts as cancelled
    if (order.paymentAttempts && order.paymentAttempts.length > 0) {
      order.paymentAttempts.forEach(attempt => {
        if (attempt.status === 'PENDING') {
          attempt.status = 'CANCELLED';
          attempt.completedAt = now;
        }
      });
    }

    // Create new payment attempt record
    const newAttempt = {
      attemptId: attemptId,
      cashfreeOrderId: paymentSession.order_id,
      paymentSessionId: paymentSession.payment_session_id,
      initiatedAt: now,
      status: 'PENDING',
    };

    if (!order.paymentAttempts) {
      order.paymentAttempts = [];
    }
    order.paymentAttempts.push(newAttempt);

    // Update order with new attempt info
    order.cashfreeOrderId = paymentSession.order_id; // Current active order ID
    order.paymentStatus = 'Pending'; // Reset to pending for new payment attempt
    order.failureReason = null; // Clear previous failure reason
    order.lastVerifiedAt = null; // Reset verification timestamp
    order.lastPaymentAttemptAt = now; // Update last attempt timestamp
    if (!order.paymentInitiatedAt) {
      order.paymentInitiatedAt = now; // Set initial payment time if not set
    }
    
    await order.save();

    console.log(`[retryOrderPayment] New payment session created: ${paymentSession.payment_session_id}, attemptId: ${attemptId}`);

    return res.json({
      success: true,
      message: 'New payment session created successfully',
      data: {
        attemptId: attemptId,
        paymentSessionId: paymentSession.payment_session_id,
        paymentLink: paymentSession.payment_link,
        orderId: order._id.toString(),
        cashfreeOrderId: paymentSession.order_id,
        initiatedAt: now.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error retrying payment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create retry payment session',
    });
  }
};

export const trackOrder = async (req, res) => {
  try {
    const { identifier } = req.params;

    // Check if identifier is a valid MongoDB ObjectId
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);
    
    let order = null;

    // Try to find by ObjectId first (fastest)
    if (isValidObjectId) {
      order = await Order.findById(identifier).populate('items.product');
    }

    // If not found, try tracking number
    if (!order) {
      order = await Order.findOne({ trackingNumber: identifier }).populate('items.product');
    }

    // If still not found, check if it's an order number format (ORD-XXXXX or OZME-XXXXX)
    if (!order && /^(ORD|OZME)-[A-Z0-9]+$/i.test(identifier)) {
      // Extract the suffix after the dash
      const orderSuffix = identifier.split('-')[1].toUpperCase();
      
      // Order numbers are in format OZME-XXXXXXXX where XXXXXXXX is last 8 chars of ObjectId
      // We can't directly query by virtual field, so we'll use a regex on _id
      // Since ObjectIds are 24 hex chars, last 8 chars means we need to find orders
      // where _id ends with those 8 characters
      // We'll use a regex pattern to match the end of ObjectId
      try {
        // Try to find orders where the last 8 characters of ObjectId match
        // This is a best-effort approach since we can't query virtual fields directly
        const recentOrders = await Order.find({})
          .sort({ createdAt: -1 })
          .limit(100) // Check last 100 orders for performance
          .populate('items.product');
        
        order = recentOrders.find(o => {
          const orderNum = `OZME-${o._id.toString().slice(-8).toUpperCase()}`;
          return orderNum.toUpperCase() === identifier.toUpperCase();
        });
      } catch (err) {
        console.error('Error searching orders by number:', err);
      }
    }

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


/**
 * Download invoice for an order (server-side gating)
 * @route GET /api/orders/:orderId/invoice
 */
export const downloadInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required',
      });
    }

    // Find order
    const order = await Order.findById(orderId).populate('items.product user');
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check if user owns the order (must be authenticated)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (req.user.id !== order.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // CRITICAL: Server-side gating - only allow invoice download for DELIVERED orders
    if (order.orderStatus !== 'Delivered' && order.deliveryStatus !== 'Delivered') {
      return res.status(403).json({
        success: false,
        message: 'Invoice is only available after your order is delivered.',
        errorCode: 'INVOICE_NOT_AVAILABLE',
        orderStatus: order.orderStatus,
      });
    }

    // Generate invoice PDF (using same logic as frontend)
    // For now, return order data and let frontend generate PDF
    // TODO: Generate PDF server-side using pdfkit or similar
    res.json({
      success: true,
      message: 'Invoice generation not yet implemented server-side. Use frontend download.',
      data: {
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          orderDate: order.createdAt,
          items: order.items,
          shippingAddress: order.shippingAddress,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          subtotal: order.subtotal,
          shippingCost: order.shippingCost,
          discountAmount: order.discountAmount,
          totalAmount: order.totalAmount,
          promoCode: order.promoCode,
        },
      },
    });
  } catch (error) {
    console.error('Download invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate invoice',
      error: error.message,
    });
  }
};
