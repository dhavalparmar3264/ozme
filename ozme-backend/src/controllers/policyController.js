import Policy from '../models/Policy.js';

/**
 * Get policy by type
 * @route GET /api/policies/:type
 */
export const getPolicy = async (req, res) => {
  try {
    const { type } = req.params;

    if (!['privacy', 'refund', 'shipping', 'terms'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid policy type',
      });
    }

    const policy = await Policy.findOne({ type });

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Policy not found',
      });
    }

    res.json({
      success: true,
      data: { policy },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

