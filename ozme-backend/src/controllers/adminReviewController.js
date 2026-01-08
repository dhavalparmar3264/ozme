import Review from '../models/Review.js';
import Product from '../models/Product.js';

/**
 * Get all reviews with filters and pagination
 * @route GET /api/admin/reviews
 */
export const getAdminReviews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status || '';
    const rating = req.query.rating || '';
    const search = req.query.search || '';

    // Build query
    const query = {};
    
    if (status && status !== 'All') {
      query.status = status;
    }
    
    if (rating) {
      query.rating = parseInt(rating);
    }

    // Search by user name or product name
    if (search) {
      query.$or = [
        { userName: { $regex: search, $options: 'i' } },
      ];
    }

    const reviews = await Review.find(query)
      .populate('user', 'name email')
      .populate('product', 'name images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments(query);

    // Get stats
    const allReviews = await Review.find({});
    const stats = {
      total: await Review.countDocuments({}),
      pending: await Review.countDocuments({ status: 'Pending' }),
      approved: await Review.countDocuments({ status: 'Approved' }),
      hidden: await Review.countDocuments({ status: 'Hidden' }),
      avgRating: allReviews.length > 0 
        ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1)
        : '0.0',
    };

    res.json({
      success: true,
      data: {
        reviews: reviews.map(review => ({
          id: review._id,
          _id: review._id,
          user: review.userName || (review.user?.name) || 'Anonymous',
          userEmail: review.user?.email || '',
          product: review.product?.name || 'Unknown Product',
          productId: review.product?._id,
          productImage: review.product?.images?.[0] || '',
          rating: review.rating,
          review: review.comment || '',
          comment: review.comment || '',
          date: review.createdAt,
          status: review.status,
        })),
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
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

/**
 * Get single review
 * @route GET /api/admin/reviews/:id
 */
export const getAdminReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('user', 'name email')
      .populate('product', 'name images');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    res.json({
      success: true,
      data: {
        review: {
          id: review._id,
          _id: review._id,
          user: review.userName || (review.user?.name) || 'Anonymous',
          userEmail: review.user?.email || '',
          product: review.product?.name || 'Unknown Product',
          productId: review.product?._id,
          productImage: review.product?.images?.[0] || '',
          rating: review.rating,
          review: review.comment || '',
          comment: review.comment || '',
          date: review.createdAt,
          status: review.status,
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
 * Update review status
 * @route PATCH /api/admin/reviews/:id/status
 */
export const updateReviewStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['Pending', 'Approved', 'Hidden'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be Pending, Approved, or Hidden',
      });
    }

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    review.status = status;
    await review.save();

    // Update product average rating if status changed to/from Approved
    await updateProductRating(review.product);

    await review.populate('user', 'name email');
    await review.populate('product', 'name images');

    res.json({
      success: true,
      message: `Review ${status.toLowerCase()} successfully`,
      data: {
        review: {
          id: review._id,
          _id: review._id,
          user: review.userName || (review.user?.name) || 'Anonymous',
          product: review.product?.name || 'Unknown Product',
          rating: review.rating,
          review: review.comment || '',
          date: review.createdAt,
          status: review.status,
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
 * Delete review
 * @route DELETE /api/admin/reviews/:id
 */
export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    const productId = review.product;
    
    await Review.findByIdAndDelete(req.params.id);

    // Update product average rating after deletion
    await updateProductRating(productId);

    res.json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
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

/**
 * Get review stats
 * @route GET /api/admin/reviews/stats
 */
export const getReviewStats = async (req, res) => {
  try {
    const total = await Review.countDocuments({});
    const pending = await Review.countDocuments({ status: 'Pending' });
    const approved = await Review.countDocuments({ status: 'Approved' });
    const hidden = await Review.countDocuments({ status: 'Hidden' });
    
    const allReviews = await Review.find({});
    const avgRating = allReviews.length > 0 
      ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1)
      : '0.0';

    // Rating distribution
    const ratingDistribution = {
      5: await Review.countDocuments({ rating: 5 }),
      4: await Review.countDocuments({ rating: 4 }),
      3: await Review.countDocuments({ rating: 3 }),
      2: await Review.countDocuments({ rating: 2 }),
      1: await Review.countDocuments({ rating: 1 }),
    };

    res.json({
      success: true,
      data: {
        stats: {
          total,
          pending,
          approved,
          hidden,
          avgRating,
          ratingDistribution,
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

