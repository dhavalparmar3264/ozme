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

    const orderedSize = orderItem.size || '100ML';
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
          size: item.size || '100ml',
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

        const orderedSize = orderItem.size || '100ML';
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

