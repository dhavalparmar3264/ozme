import FeedbackPromoCode from '../models/FeedbackPromoCode.js';
import User from '../models/User.js';
import Order from '../models/Order.js';

/**
 * Get all feedback promo codes (Admin)
 * @route GET /api/admin/feedback-promo-codes
 * @access Private/Admin
 */
export const getAllFeedbackPromoCodes = async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query filter
    const filter = {};
    if (status === 'used') {
      filter.isUsed = true;
    } else if (status === 'unused') {
      filter.isUsed = false;
    }

    // Get total count for pagination
    const total = await FeedbackPromoCode.countDocuments(filter);

    // Get promo codes with user and order info
    const promoCodes = await FeedbackPromoCode.find(filter)
      .populate('userId', 'name email phone')
      .populate('orderId', 'orderNumber totalAmount createdAt')
      .sort({ issuedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Format response
    const formattedCodes = promoCodes.map(code => ({
      _id: code._id,
      code: code.code,
      user: code.userId ? {
        id: code.userId._id,
        name: code.userId.name,
        email: code.userId.email,
        phone: code.userId.phone,
      } : null,
      email: code.email,
      phone: code.phone,
      issuedAt: code.issuedAt,
      expiresAt: code.expiresAt,
      isUsed: code.isUsed,
      usedAt: code.usedAt,
      order: code.orderId ? {
        id: code.orderId._id,
        orderNumber: code.orderId.orderNumber,
        totalAmount: code.orderId.totalAmount,
        createdAt: code.orderId.createdAt,
      } : null,
      discountPercent: code.discountPercent,
      source: code.source,
      isExpired: false, // No expiry for feedback promo codes
      isValid: !code.isUsed,
    }));

    res.json({
      success: true,
      data: {
        promoCodes: formattedCodes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
        filters: {
          status: status || 'all',
        },
      },
    });
  } catch (error) {
    console.error('Get feedback promo codes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback promo codes',
      error: error.message,
    });
  }
};

/**
 * Get single feedback promo code by ID (Admin)
 * @route GET /api/admin/feedback-promo-codes/:id
 * @access Private/Admin
 */
export const getFeedbackPromoCodeById = async (req, res) => {
  try {
    const { id } = req.params;

    const promoCode = await FeedbackPromoCode.findById(id)
      .populate('userId', 'name email phone')
      .populate('orderId', 'orderNumber totalAmount createdAt')
      .lean();

    if (!promoCode) {
      return res.status(404).json({
        success: false,
        message: 'Feedback promo code not found',
      });
    }

    res.json({
      success: true,
      data: {
        promoCode: {
          _id: promoCode._id,
          code: promoCode.code,
          user: promoCode.userId ? {
            id: promoCode.userId._id,
            name: promoCode.userId.name,
            email: promoCode.userId.email,
            phone: promoCode.userId.phone,
          } : null,
          email: promoCode.email,
          phone: promoCode.phone,
          issuedAt: promoCode.issuedAt,
          expiresAt: promoCode.expiresAt,
          isUsed: promoCode.isUsed,
          usedAt: promoCode.usedAt,
          order: promoCode.orderId ? {
            id: promoCode.orderId._id,
            orderNumber: promoCode.orderId.orderNumber,
            totalAmount: promoCode.orderId.totalAmount,
            createdAt: promoCode.orderId.createdAt,
          } : null,
          discountPercent: promoCode.discountPercent,
          source: promoCode.source,
          isExpired: false, // No expiry for feedback promo codes
          isValid: !promoCode.isUsed,
        },
      },
    });
  } catch (error) {
    console.error('Get feedback promo code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback promo code',
      error: error.message,
    });
  }
};
