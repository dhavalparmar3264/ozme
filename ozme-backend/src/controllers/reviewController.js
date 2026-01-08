import Review from '../models/Review.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';

/**
 * Get reviews for a product (only approved reviews)
 * @route GET /api/reviews/product/:productId
 */
export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ 
      product: productId, 
      status: 'Approved' 
    })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments({ 
      product: productId, 
      status: 'Approved' 
    });

    // Calculate rating distribution
    const allReviews = await Review.find({ 
      product: productId, 
      status: 'Approved' 
    });

    const ratingDistribution = {
      5: allReviews.filter(r => r.rating === 5).length,
      4: allReviews.filter(r => r.rating === 4).length,
      3: allReviews.filter(r => r.rating === 3).length,
      2: allReviews.filter(r => r.rating === 2).length,
      1: allReviews.filter(r => r.rating === 1).length,
    };

    const avgRating = allReviews.length > 0 
      ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1)
      : '0.0';

    res.json({
      success: true,
      data: {
        reviews: reviews.map(review => ({
          id: review._id,
          userName: review.userName,
          rating: review.rating,
          comment: review.comment,
          date: review.createdAt,
        })),
        stats: {
          total,
          avgRating,
          ratingDistribution,
        },
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching product reviews:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

/**
 * Submit a review for a product
 * @route POST /api/reviews
 */
export const createReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required',
      });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
      });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Check if user has purchased this product (optional but recommended)
    const hasPurchased = await Order.findOne({
      user: userId,
      'items.product': productId,
      orderStatus: { $in: ['Delivered', 'Processing', 'Shipped'] },
    });

    if (!hasPurchased) {
      return res.status(400).json({
        success: false,
        message: 'You can only review products you have purchased',
      });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      user: userId,
      product: productId,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product',
      });
    }

    // Get user name
    const userName = req.user.name || 'Anonymous';

    // Create review (starts as Pending for moderation)
    const review = await Review.create({
      user: userId,
      product: productId,
      rating,
      comment: comment || '',
      userName,
      status: 'Pending',
    });

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully. It will be visible after approval.',
      data: {
        review: {
          id: review._id,
          rating: review.rating,
          comment: review.comment,
          status: review.status,
        },
      },
    });
  } catch (error) {
    // Handle duplicate review error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product',
      });
    }

    console.error('Error creating review:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

/**
 * Update user's own review
 * @route PUT /api/reviews/:id
 */
export const updateReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const userId = req.user.id;

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    // Check if user owns this review
    if (review.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this review',
      });
    }

    // Validate rating
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
      });
    }

    // Update review
    if (rating) review.rating = rating;
    if (comment !== undefined) review.comment = comment;
    
    // Reset status to Pending after edit (for re-moderation)
    review.status = 'Pending';

    await review.save();

    // Update product average rating
    await updateProductRating(review.product);

    res.json({
      success: true,
      message: 'Review updated successfully. It will be visible after re-approval.',
      data: {
        review: {
          id: review._id,
          rating: review.rating,
          comment: review.comment,
          status: review.status,
        },
      },
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

/**
 * Delete user's own review
 * @route DELETE /api/reviews/:id
 */
export const deleteReview = async (req, res) => {
  try {
    const userId = req.user.id;

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    // Check if user owns this review
    if (review.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this review',
      });
    }

    const productId = review.product;

    await Review.findByIdAndDelete(req.params.id);

    // Update product average rating
    await updateProductRating(productId);

    res.json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

/**
 * Get user's review for a specific product
 * @route GET /api/reviews/my/:productId
 */
export const getMyReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    const review = await Review.findOne({
      user: userId,
      product: productId,
    });

    if (!review) {
      return res.json({
        success: true,
        data: { review: null },
      });
    }

    res.json({
      success: true,
      data: {
        review: {
          id: review._id,
          rating: review.rating,
          comment: review.comment,
          status: review.status,
          date: review.createdAt,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching user review:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

/**
 * Check if user can review a product
 * @route GET /api/reviews/can-review/:productId
 */
export const canReviewProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    // Check if user has purchased this product
    const hasPurchased = await Order.findOne({
      user: userId,
      'items.product': productId,
      orderStatus: { $in: ['Delivered', 'Processing', 'Shipped'] },
    });

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      user: userId,
      product: productId,
    });

    res.json({
      success: true,
      data: {
        canReview: !!hasPurchased && !existingReview,
        hasPurchased: !!hasPurchased,
        hasReviewed: !!existingReview,
      },
    });
  } catch (error) {
    console.error('Error checking review eligibility:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

/**
 * Helper function to update product average rating
 * @param {ObjectId} productId - Product ID
 */
const updateProductRating = async (productId) => {
  try {
    // Only count approved reviews for average rating
    const approvedReviews = await Review.find({ 
      product: productId, 
      status: 'Approved' 
    });

    const product = await Product.findById(productId);
    if (!product) return;

    if (approvedReviews.length > 0) {
      const avgRating = approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length;
      product.rating = Math.round(avgRating * 10) / 10; // Round to 1 decimal
      product.reviewsCount = approvedReviews.length;
    } else {
      product.rating = 0;
      product.reviewsCount = 0;
    }

    await product.save();
  } catch (error) {
    console.error('Error updating product rating:', error);
  }
};

