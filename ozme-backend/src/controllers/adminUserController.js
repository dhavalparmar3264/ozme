import User from '../models/User.js';
import Order from '../models/Order.js';
import WishlistItem from '../models/WishlistItem.js';

/**
 * Get all users with pagination and filters
 * @route GET /api/admin/users
 */
export const getAdminUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || '';

    // Build query - only get regular users, not admins, and exclude merged accounts
    const query = { 
      role: 'user',
      accountStatus: { $ne: 'merged' }, // Exclude merged accounts
    };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    // Get users
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    // Get order stats for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        // Get order stats
        const orderStats = await Order.aggregate([
          { $match: { user: user._id } },
          {
            $group: {
              _id: null,
              totalOrders: { $sum: 1 },
              totalSpent: { $sum: '$totalAmount' },
            },
          },
        ]);

        // Get recent orders
        const recentOrders = await Order.find({ user: user._id })
          .select('orderNumber totalAmount orderStatus createdAt')
          .sort({ createdAt: -1 })
          .limit(5);

        // Get wishlist count
        const wishlistCount = await WishlistItem.countDocuments({ user: user._id });

        return {
          id: user._id,
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          photoURL: user.photoURL || '',
          googleId: user.googleId ? true : false,
          status: 'Active', // All users are active by default
          created: user.createdAt,
          createdAt: user.createdAt,
          // Login audit fields
          lastLoginAt: user.lastLoginAt || null,
          lastLoginMethod: user.lastLoginMethod || null,
          lastLoginIdentifier: user.lastLoginIdentifier || null,
          lastLoginIp: user.lastLoginIp || null,
          lastLoginUserAgent: user.lastLoginUserAgent || null,
          // Account linking fields
          authProviders: user.authProviders || [],
          accountStatus: user.accountStatus || 'active',
          totalOrders: orderStats[0]?.totalOrders || 0,
          totalSpent: orderStats[0]?.totalSpent || 0,
          wishlistCount,
          recentOrders: recentOrders.map(o => ({
            id: o._id,
            orderNumber: o.orderNumber,
            amount: o.totalAmount,
            status: o.orderStatus,
            date: o.createdAt,
          })),
          addresses: user.addresses || [],
        };
      })
    );

    // Calculate stats
    const allUsers = await User.countDocuments({ role: 'user' });
    const totalOrdersResult = await Order.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
        },
      },
    ]);

    const stats = {
      total: allUsers,
      active: allUsers, // All users are active
      totalOrders: totalOrdersResult[0]?.total || 0,
      totalRevenue: totalOrdersResult[0]?.revenue || 0,
    };

    res.json({
      success: true,
      data: {
        users: usersWithStats,
        stats,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

/**
 * Get single user with full details
 * @route GET /api/admin/users/:id
 */
export const getAdminUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Get all orders
    const orders = await Order.find({ user: user._id })
      .populate('items.product', 'name images')
      .sort({ createdAt: -1 });

    // Get order stats
    const orderStats = await Order.aggregate([
      { $match: { user: user._id } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$totalAmount' },
        },
      },
    ]);

    // Get wishlist
    const wishlistItems = await WishlistItem.find({ user: user._id })
      .populate('product', 'name images price');

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          photoURL: user.photoURL || '',
          googleId: user.googleId ? true : false,
          status: 'Active',
          created: user.createdAt,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          // Login audit fields
          lastLoginAt: user.lastLoginAt || null,
          lastLoginMethod: user.lastLoginMethod || null,
          lastLoginIdentifier: user.lastLoginIdentifier || null,
          lastLoginIp: user.lastLoginIp || null,
          lastLoginUserAgent: user.lastLoginUserAgent || null,
          // Account linking fields
          authProviders: user.authProviders || [],
          accountStatus: user.accountStatus || 'active',
          totalOrders: orderStats[0]?.totalOrders || 0,
          totalSpent: orderStats[0]?.totalSpent || 0,
          addresses: user.addresses || [],
        },
        orders: orders.map(o => ({
          id: o._id,
          orderNumber: o.orderNumber,
          amount: o.totalAmount,
          status: o.orderStatus,
          paymentStatus: o.paymentStatus,
          paymentMethod: o.paymentMethod,
          date: o.createdAt,
          items: o.items?.map(item => ({
            name: item.product?.name || 'Product',
            image: item.product?.images?.[0] || '',
            quantity: item.quantity,
            price: item.price,
            size: item.size,
          })) || [],
        })),
        wishlist: wishlistItems.map(w => ({
          id: w._id,
          productId: w.product?._id,
          name: w.product?.name || 'Product',
          image: w.product?.images?.[0] || '',
          price: w.product?.price || 0,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

/**
 * Get user stats
 * @route GET /api/admin/users/stats
 */
export const getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    
    // Users registered today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const newUsersToday = await User.countDocuments({
      role: 'user',
      createdAt: { $gte: today, $lt: tomorrow },
    });

    // Users registered this month
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const newUsersThisMonth = await User.countDocuments({
      role: 'user',
      createdAt: { $gte: firstDayOfMonth },
    });

    // Total order stats
    const orderStats = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          activeUsers: totalUsers,
          newUsersToday,
          newUsersThisMonth,
          totalOrders: orderStats[0]?.totalOrders || 0,
          totalRevenue: orderStats[0]?.totalRevenue || 0,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};




