import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

/**
 * Get dashboard data - all metrics in one response
 * @route GET /api/admin/dashboard
 */
export const getAdminDashboard = async (req, res) => {
  try {
    // OPTIMIZATION: Run all queries in parallel for better performance
    const [
      revenueResult,
      totalOrders,
      statusCounts,
      totalCustomers,
      recentOrders,
      lowStockProducts
    ] = await Promise.all([
      // Total Revenue = SUM(order.totalAmount) where paymentStatus = "Paid" OR COD confirmed
      Order.aggregate([
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
      ]),
      // Total Orders = COUNT(all orders)
      Order.countDocuments(),
      // Order status counts
      Order.aggregate([
        {
          $group: {
            _id: '$orderStatus',
            count: { $sum: 1 },
          },
        },
      ]),
      // Total Customers = COUNT(users where role = "user")
      User.countDocuments({ role: 'user' }),
      // Recent Orders - last 5 orders sorted by createdAt DESC
      Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'name email')
        .select('totalAmount orderStatus paymentMethod createdAt shippingAddress')
        .lean(),
      // OPTIMIZED: Low stock items using aggregation pipeline
      Product.aggregate([
        {
          $match: { active: true }
        },
        {
          $addFields: {
            // Calculate total stock from sizes array or single stockQuantity
            totalStock: {
              $cond: {
                if: { $and: [{ $isArray: '$sizes' }, { $gt: [{ $size: '$sizes' }, 0] }] },
                then: {
                  $reduce: {
                    input: '$sizes',
                    initialValue: 0,
                    in: { $add: ['$$value', { $ifNull: ['$$this.stockQuantity', 0] }] }
                  }
                },
                else: { $ifNull: ['$stockQuantity', 0] }
              }
            }
          }
        },
        {
          $match: {
            totalStock: { $gt: 0, $lte: 5 } // Threshold: 5 units
          }
        },
        {
          $project: {
            id: { $toString: '$_id' },
            name: 1,
            stock: '$totalStock',
            threshold: { $literal: 5 }
          }
        },
        {
          $sort: { stock: 1 } // Sort by stock (lowest first)
        },
        {
          $limit: 4 // Limit to 4 items
        }
      ])
    ]);

    const revenue = revenueResult[0]?.total || 0;

    const statusMap = statusCounts.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const pendingOrders = statusMap['Pending'] || 0;
    const processingOrders = statusMap['Processing'] || 0;
    const shippedOrders = statusMap['Shipped'] || 0;
    const deliveredOrders = statusMap['Delivered'] || 0;
    const cancelledOrders = statusMap['Cancelled'] || 0;

    const formattedRecentOrders = recentOrders.map(order => ({
      orderId: `OZME-${order._id.toString().slice(-8).toUpperCase()}`,
      customer: order.user?.name || order.shippingAddress?.name || 'Guest',
      amount: order.totalAmount,
      status: order.orderStatus,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt,
    }));

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
        lowStockProducts: lowStockProducts || [],
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

