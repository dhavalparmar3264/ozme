import CartItem from '../models/CartItem.js';
import { generateGuestToken } from '../utils/generateGuestToken.js';

/**
 * Get user's cart
 * @route GET /api/cart
 */
export const getCart = async (req, res) => {
  try {
    let query = {};
    if (req.user) {
      query.user = req.user.id;
    } else {
      const guestToken = req.cookies.guestToken || req.headers['x-guest-token'];
      if (!guestToken) {
        return res.json({
          success: true,
          data: { items: [], total: 0 },
        });
      }
      query.guestToken = guestToken;
    }

    const items = await CartItem.find(query).populate('product');

    // Filter out items with null/deleted products and calculate total
    const validItems = items.filter(item => item.product && item.product.price !== null && item.product.price !== undefined);
    
    // Remove invalid items from database
    const invalidItemIds = items
      .filter(item => !item.product || item.product.price === null || item.product.price === undefined)
      .map(item => item._id);
    
    if (invalidItemIds.length > 0) {
      await CartItem.deleteMany({ _id: { $in: invalidItemIds } });
    }

    // Calculate total from valid items only
    const total = validItems.reduce((sum, item) => {
      return sum + (item.product?.price || 0) * (item.quantity || 0);
    }, 0);

    res.json({
      success: true,
      data: {
        items: validItems,
        total,
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
 * Add item to cart
 * @route POST /api/cart
 */
export const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1, size = '120ml' } = req.body;

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

    // Check if item already exists
    const existingItem = await CartItem.findOne({
      ...(userId ? { user: userId } : { guestToken }),
      product: productId,
      size,
    });

    if (existingItem) {
      existingItem.quantity += quantity;
      await existingItem.save();
      await existingItem.populate('product');

      return res.json({
        success: true,
        message: 'Cart updated',
        data: { item: existingItem },
      });
    }

    // Create new cart item
    const cartItem = await CartItem.create({
      user: userId,
      guestToken,
      product: productId,
      quantity,
      size,
    });

    await cartItem.populate('product');

    res.status(201).json({
      success: true,
      message: 'Item added to cart',
      data: { item: cartItem },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

/**
 * Update cart item quantity
 * @route PATCH /api/cart/:itemId
 */
export const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const { itemId } = req.params;

    let query = { _id: itemId };
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

    const item = await CartItem.findOne(query);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found',
      });
    }

    if (quantity <= 0) {
      await CartItem.findByIdAndDelete(itemId);
      return res.json({
        success: true,
        message: 'Item removed from cart',
      });
    }

    item.quantity = quantity;
    await item.save();
    await item.populate('product');

    res.json({
      success: true,
      message: 'Cart item updated',
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
 * Remove item from cart
 * @route DELETE /api/cart/:itemId
 */
export const removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;

    let query = { _id: itemId };
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

    const item = await CartItem.findOneAndDelete(query);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found',
      });
    }

    res.json({
      success: true,
      message: 'Item removed from cart',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

/**
 * Clear cart
 * @route DELETE /api/cart
 */
export const clearCart = async (req, res) => {
  try {
    let query = {};
    if (req.user) {
      query.user = req.user.id;
    } else {
      const guestToken = req.cookies.guestToken || req.headers['x-guest-token'];
      if (!guestToken) {
        return res.json({
          success: true,
          message: 'Cart already empty',
        });
      }
      query.guestToken = guestToken;
    }

    await CartItem.deleteMany(query);

    res.json({
      success: true,
      message: 'Cart cleared',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

