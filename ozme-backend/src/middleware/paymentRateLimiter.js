import rateLimit from 'express-rate-limit';

/**
 * Rate Limiter for Payment Retry Endpoint
 * Prevents spam retry attempts
 */
export const paymentRetryRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // Max 3 retry attempts per minute per IP
  message: {
    success: false,
    message: 'Too many retry attempts. Please wait a minute before trying again.',
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

