import WishlistItem from '../models/WishlistItem.js';
import { generateGuestToken } from '../utils/generateGuestToken.js';

/**
 * Get user's wishlist
 * @route GET /api/wishlist
 */
export const getWishlist = async (req, res) => {
  try {
    let query = {};
    if (req.user) {
      query.user = req.user.id;
    } else {
      const guestToken = req.cookies.guestToken || req.headers['x-guest-token'];
      if (!guestToken) {
        return res.json({
          success: true,
          data: { items: [] },
        });
      }
      query.guestToken = guestToken;
    }

    const items = await WishlistItem.find(query).populate('product');

    // Filter out items with null/deleted products
    const validItems = items.filter(item => item.product && item.product._id);

    // Remove invalid items from database
    const invalidItemIds = items
      .filter(item => !item.product || !item.product._id)
      .map(item => item._id);
    
    if (invalidItemIds.length > 0) {
      await WishlistItem.deleteMany({ _id: { $in: invalidItemIds } });
    }

    res.json({
      success: true,
      data: { items: validItems },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

/**
 * Add item to wishlist
 * @route POST /api/wishlist
 */
export const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    let userId = null;
    let guestToken = null;

    if (req.user) {
      userId = req.user.id;
    } else {
      guestToken = req.cookies.guestToken || req.headers['x-guest-token'];
      if (!guestToken) {
        guestToken = generateGuestToken();
        res.cookie('guestToken', guestToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });
      }
    }

    // Check if already in wishlist
    const existing = await WishlistItem.findOne({
      ...(userId ? { user: userId } : { guestToken }),
      product: productId,
    });

    if (existing) {
      return res.json({
        success: true,
        message: 'Already in wishlist',
        data: { item: existing },
      });
    }

    // Create wishlist item
    const item = await WishlistItem.create({
      user: userId,
      guestToken,
      product: productId,
    });

    await item.populate('product');

    res.status(201).json({
      success: true,
      message: 'Added to wishlist',
      data: { item },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

/**
 * Remove item from wishlist
 * @route DELETE /api/wishlist/:productId
 */
export const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    let query = { product: productId };
    if (req.user) {
      query.user = req.user.id;
    } else {
      const guestToken = req.cookies.guestToken || req.headers['x-guest-token'];
      if (!guestToken) {
        return res.status(401).json({
          success: false,
          message: 'Guest token required',
        });
      }
      query.guestToken = guestToken;
    }

    const item = await WishlistItem.findOneAndDelete(query);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in wishlist',
      });
    }

    res.json({
      success: true,
      message: 'Removed from wishlist',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

/**
 * Check if product is in wishlist
 * @route GET /api/wishlist/check/:productId
 */
export const checkWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    let query = { product: productId };
    if (req.user) {
      query.user = req.user.id;
    } else {
      const guestToken = req.cookies.guestToken || req.headers['x-guest-token'];
      if (!guestToken) {
        return res.json({
          success: true,
          data: { inWishlist: false },
        });
      }
      query.guestToken = guestToken;
    }

    const item = await WishlistItem.findOne(query);

    res.json({
      success: true,
      data: { inWishlist: !!item },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

