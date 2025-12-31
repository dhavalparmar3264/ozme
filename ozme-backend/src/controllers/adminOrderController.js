import Order from '../models/Order.js';
import Product from '../models/Product.js';

/**
 * Helper function to reduce product stock for order items
 * @param {Array} orderItems - Array of order items with product, quantity, and size
 * @returns {Promise<void>}
 */
const reduceOrderStock = async (orderItems) => {
  for (const orderItem of orderItems) {
    const product = await Product.findById(orderItem.product);
    if (!product) {
      console.error(`Product with ID ${orderItem.product} not found during stock reduction`);
      continue;
    }

    const orderedSize = orderItem.size || '100ML';
    const orderedQuantity = orderItem.quantity || 1;

    // Check if product has sizes array
    if (product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0) {
      // Find the size in the sizes array
      const sizeIndex = product.sizes.findIndex(s => 
        s.size && s.size.toUpperCase() === orderedSize.toUpperCase()
      );

      if (sizeIndex !== -1) {
        const currentStock = product.sizes[sizeIndex].stockQuantity || 0;
        
        // Reduce stock for the specific size
        product.sizes[sizeIndex].stockQuantity = Math.max(0, currentStock - orderedQuantity);
        product.sizes[sizeIndex].inStock = (product.sizes[sizeIndex].stockQuantity || 0) > 0;

        // Update product-level stock quantity (sum of all sizes)
        product.stockQuantity = product.sizes.reduce((sum, s) => sum + (s.stockQuantity || 0), 0);
        product.inStock = product.sizes.some(s => s.inStock !== false && (s.stockQuantity || 0) > 0);
      }
    } else {
      // Handle single size product (backward compatibility)
      const currentStock = product.stockQuantity || 0;
      
      // Reduce stock
      product.stockQuantity = Math.max(0, currentStock - orderedQuantity);
      product.inStock = product.stockQuantity > 0;
    }

    // Save updated product
    await product.save();
  }
};

/**
 * Get all orders with filters
 * @route GET /api/admin/orders
 */
export const getAdminOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status || '';
    const paymentStatus = req.query.paymentStatus || '';
    const startDate = req.query.startDate || '';
    const endDate = req.query.endDate || '';

    // Build query
    const query = {};
    
    if (status) {
      query.orderStatus = status;
    }
    
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    const orders = await Order.find(query)
      .populate('user', 'name email')
      .populate('items.product')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

/**
 * Get single order
 * @route GET /api/admin/orders/:id
 */
export const getAdminOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('items.product');

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
 * Update order status
 * @route PATCH /api/admin/orders/:id/status
 */
export const updateAdminOrderStatus = async (req, res) => {
  try {
    const { orderStatus, deliveryStatus, paymentStatus, trackingNumber, courierName } = req.body;

    const order = await Order.findById(req.params.id).populate('items.product');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    const previousOrderStatus = order.orderStatus;
    const previousPaymentStatus = order.paymentStatus;
    const previousDeliveryStatus = order.deliveryStatus;

    // Check if order is being confirmed (moving to Processing) and stock hasn't been reduced yet
    const isBeingConfirmed = (orderStatus === 'Processing' && previousOrderStatus === 'Pending') ||
                             (paymentStatus === 'Paid' && previousPaymentStatus !== 'Paid' && order.orderStatus === 'Pending');

    // Update orderStatus (legacy field, keep for backward compatibility)
    if (orderStatus) {
      order.orderStatus = orderStatus;
    }
    
    // Update deliveryStatus (primary field for shipping tracking)
    if (deliveryStatus) {
      // Validate deliveryStatus
      const validStatuses = ['Pending', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];
      if (!validStatuses.includes(deliveryStatus)) {
        return res.status(400).json({
          success: false,
          message: `Invalid deliveryStatus. Must be one of: ${validStatuses.join(', ')}`,
        });
      }
      
      order.deliveryStatus = deliveryStatus;
      
      // Set timestamps based on deliveryStatus (idempotent - only set if not already set)
      const now = new Date();
      if (deliveryStatus === 'Shipped' && !order.shippedAt) {
        order.shippedAt = now;
      } else if (deliveryStatus === 'Out for Delivery' && !order.outForDeliveryAt) {
        order.outForDeliveryAt = now;
      } else if (deliveryStatus === 'Delivered' && !order.deliveredAt) {
        order.deliveredAt = now;
      }
      
      // Sync orderStatus with deliveryStatus for backward compatibility
      if (orderStatus === undefined) {
        order.orderStatus = deliveryStatus;
      }
    }
    
    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }
    
    // Update shipping information
    if (trackingNumber !== undefined) {
      // Validate trackingNumber length
      if (trackingNumber && trackingNumber.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Tracking number must be 100 characters or less',
        });
      }
      order.trackingNumber = trackingNumber;
    }
    
    if (courierName !== undefined) {
      // Validate courierName
      if (courierName && typeof courierName !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Courier name must be a string',
        });
      }
      if (courierName && courierName.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Courier name must be 100 characters or less',
        });
      }
      order.courierName = courierName;
    }

    // Reduce stock if order is being confirmed for the first time
    // This handles cases where admin manually confirms a pending order
    if (isBeingConfirmed && (order.orderStatus === 'Processing' || order.paymentStatus === 'Paid')) {
      try {
        await reduceOrderStock(order.items);
        console.log(`Stock reduced for order ${order._id} via admin status update`);
      } catch (stockError) {
        console.error('Error reducing stock during admin status update:', stockError);
        // Don't fail the status update if stock reduction fails, but log it
      }
    }

    await order.save();

    await order.populate('user', 'name email');
    await order.populate('items.product');

    console.log(`✅ Order ${order._id} status updated:`, {
      orderStatus: order.orderStatus,
      deliveryStatus: order.deliveryStatus,
      courierName: order.courierName,
      trackingNumber: order.trackingNumber,
    });

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: { order },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

