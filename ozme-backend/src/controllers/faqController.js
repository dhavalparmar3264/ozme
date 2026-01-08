import Faq from '../models/Faq.js';

/**
 * Get all FAQs
 * @route GET /api/faqs
 */
export const getFaqs = async (req, res) => {
  try {
    const faqs = await Faq.find().sort({ order: 1, createdAt: 1 });

    res.json({
      success: true,
      data: { faqs },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

