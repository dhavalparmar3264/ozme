import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

/**
 * Get dashboard data - all metrics in one response
 * @route GET /api/admin/dashboard
 */
export const getAdminDashboard = async (req, res) => {
  try {
    // Total Revenue = SUM(order.totalAmount) where paymentStatus = "Paid" OR COD confirmed
    // COD orders are confirmed when created (paymentStatus can be "Pending" but order is confirmed)
    const revenueResult = await Order.aggregate([
      {
        $match: {
          $or: [
            { paymentStatus: 'Paid' },
            { paymentMethod: 'COD' }, // COD orders are confirmed when created
          ],
          orderStatus: { $ne: 'Cancelled' },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' },
        },
      },
    ]);
    const revenue = revenueResult[0]?.total || 0;

    // Total Orders = COUNT(all orders)
    const totalOrders = await Order.countDocuments();

    // Order status counts
    const statusCounts = await Order.aggregate([
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 },
        },
      },
    ]);

    const statusMap = statusCounts.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const pendingOrders = statusMap['Pending'] || 0;
    const processingOrders = statusMap['Processing'] || 0;
    const shippedOrders = statusMap['Shipped'] || 0;
    const deliveredOrders = statusMap['Delivered'] || 0;
    const cancelledOrders = statusMap['Cancelled'] || 0;

    // Total Customers = COUNT(users where role = "user")
    const totalCustomers = await User.countDocuments({ role: 'user' });

    // Recent Orders - last 5 orders sorted by createdAt DESC
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name email')
      .select('totalAmount orderStatus paymentMethod createdAt shippingAddress')
      .lean();

    const formattedRecentOrders = recentOrders.map(order => ({
      orderId: `OZME-${order._id.toString().slice(-8).toUpperCase()}`,
      customer: order.user?.name || order.shippingAddress?.name || 'Guest',
      amount: order.totalAmount,
      status: order.orderStatus,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt,
    }));

    // Low stock items = products where stock <= threshold (e.g., 5)
    const products = await Product.find({ active: true }).lean();
    const lowStock = [];

    for (const product of products) {
      let totalStock = 0;

      if (product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0) {
        // Calculate total stock from sizes array
        totalStock = product.sizes.reduce((sum, size) => sum + (size.stockQuantity || 0), 0);
      } else {
        // Single size product
        totalStock = product.stockQuantity || 0;
      }

      // Threshold: 5 units
      if (totalStock > 0 && totalStock <= 5) {
        lowStock.push({
          id: product._id.toString(),
          name: product.name,
          stock: totalStock,
          threshold: 5,
        });
      }
    }

    // Sort by stock (lowest first) and limit to 4
    lowStock.sort((a, b) => a.stock - b.stock);
    const lowStockItems = lowStock.slice(0, 4);

    res.json({
      success: true,
      data: {
        revenue: revenue || 0,
        totalOrders: totalOrders || 0,
        pendingOrders: pendingOrders || 0,
        processingOrders: processingOrders || 0,
        shippedOrders: shippedOrders || 0,
        deliveredOrders: deliveredOrders || 0,
        cancelledOrders: cancelledOrders || 0,
        totalCustomers: totalCustomers || 0,
        recentOrders: formattedRecentOrders || [],
        lowStockProducts: lowStockItems || [],
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

/**
 * Get dashboard summary (legacy endpoint - kept for backward compatibility)
 * @route GET /api/admin/dashboard/summary
 */
export const getAdminDashboardSummary = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Total orders
    const totalOrders = await Order.countDocuments();

    // Total revenue
    const revenueResult = await Order.aggregate([
      {
        $match: {
          $or: [
            { paymentStatus: 'Paid' },
            { paymentMethod: 'COD' },
          ],
          orderStatus: { $ne: 'Cancelled' },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' },
        },
      },
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    // Total users
    const totalUsers = await User.countDocuments({ role: 'user' });

    // Today's orders
    const todaysOrders = await Order.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow },
    });

    // Today's revenue
    const todayRevenueResult = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: today, $lt: tomorrow },
          $or: [
            { paymentStatus: 'Paid' },
            { paymentMethod: 'COD' },
          ],
          orderStatus: { $ne: 'Cancelled' },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' },
        },
      },
    ]);
    const todaysRevenue = todayRevenueResult[0]?.total || 0;

    // Orders by status
    const ordersByStatus = await Order.aggregate([
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalOrders,
          totalRevenue,
          totalUsers,
          todaysOrders,
          todaysRevenue,
        },
        ordersByStatus: ordersByStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

