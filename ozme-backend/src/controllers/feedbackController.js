import Feedback from '../models/Feedback.js';

/**
 * Get client IP address from request
 */
const getClientIp = (req) => {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
         req.headers['x-real-ip'] ||
         'unknown';
};

/**
 * Rate limit check: Max 3 submissions per IP per hour
 */
const checkRateLimit = async (ipAddress) => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  const recentSubmissions = await Feedback.countDocuments({
    ip_address: ipAddress,
    created_at: { $gte: oneHourAgo },
  });
  
  return recentSubmissions < 3;
};

/**
 * Submit feedback
 * @route POST /api/feedback
 */
export const submitFeedback = async (req, res) => {
  try {
    const {
      longevity,
      projection,
      fragrance_satisfaction,
      packaging,
      delivery,
      recommend,
      order_ref,
      note,
      honeypot, // Anti-spam honeypot field
    } = req.body;

    // Honeypot check - if honeypot field is filled, it's likely a bot
    if (honeypot && honeypot.trim() !== '') {
      console.warn('⚠️  Honeypot field filled - potential bot submission');
      return res.status(200).json({
        success: true,
        message: 'Thank you for your feedback!',
        couponCode: 'OZME10',
      });
    }

    // Validate required fields
    if (!longevity || !fragrance_satisfaction || !packaging) {
      return res.status(400).json({
        success: false,
        message: 'Please answer all required questions (Longevity, Fragrance Satisfaction, and Packaging)',
      });
    }

    // Validate enum values
    const validLongevity = ['2-4 hours', '4-6 hours', '6-8 hours', '8+ hours'];
    if (!validLongevity.includes(longevity)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid longevity value',
      });
    }

    const validFragranceSatisfaction = ['Loved it', 'Good', 'Okay', 'Not for me'];
    if (!validFragranceSatisfaction.includes(fragrance_satisfaction)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid fragrance satisfaction value',
      });
    }

    const validPackaging = ['Excellent', 'Good', 'Average', 'Poor'];
    if (!validPackaging.includes(packaging)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid packaging value',
      });
    }

    // Validate optional fields if provided
    if (projection && !['Soft / close to skin', 'Moderate', 'Strong'].includes(projection)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid projection value',
      });
    }

    if (delivery && !['On time', 'Slightly delayed', 'Delayed'].includes(delivery)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid delivery value',
      });
    }

    if (recommend && !['Yes', 'Maybe', 'No'].includes(recommend)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recommend value',
      });
    }

    // Validate note length
    if (note && note.length > 200) {
      return res.status(400).json({
        success: false,
        message: 'Note cannot exceed 200 characters',
      });
    }

    // Get client IP for rate limiting
    const ipAddress = getClientIp(req);

    // Check rate limit
    const canSubmit = await checkRateLimit(ipAddress);
    if (!canSubmit) {
      return res.status(429).json({
        success: false,
        message: 'Too many submissions. Please try again later.',
      });
    }

    // Create feedback record
    const feedback = await Feedback.create({
      longevity,
      projection,
      fragrance_satisfaction,
      packaging,
      delivery,
      recommend,
      order_ref: order_ref?.trim() || undefined,
      note: note?.trim() || undefined,
      ip_address: ipAddress,
    });

    console.log(`✅ Feedback submitted successfully - ID: ${feedback._id}, IP: ${ipAddress}`);

    // Return success with coupon code
    res.status(201).json({
      success: true,
      message: 'Thank you for your feedback!',
      couponCode: 'OZME10',
    });
  } catch (error) {
    console.error('Feedback submission error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit feedback',
    });
  }
};

/**
 * Get all feedback (admin only - optional)
 * @route GET /api/feedback
 */
export const getFeedback = async (req, res) => {
  try {
    // This could be protected with admin auth if needed
    const feedback = await Feedback.find()
      .sort({ created_at: -1 })
      .limit(100)
      .select('-ip_address'); // Don't expose IP addresses

    res.json({
      success: true,
      data: {
        feedback,
        count: feedback.length,
      },
    });
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch feedback',
    });
  }
};

