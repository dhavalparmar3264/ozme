import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay instance
const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Create Razorpay order
 * @param {number} amount - Amount in rupees (will be converted to paise)
 * @param {string} orderId - Our internal order ID for reference
 * @returns {Promise<Object>} - Razorpay order object
 */
export const createRazorpayOrder = async (amount, orderId) => {
    try {
        const options = {
            amount: Math.round(amount * 100), // Convert to paise
            currency: 'INR',
            receipt: orderId,
            payment_capture: 1, // Auto capture payment
        };

        const order = await razorpayInstance.orders.create(options);
        return order;
    } catch (error) {
        console.error('Razorpay create order error:', error);
        throw new Error('Failed to create Razorpay order');
    }
};

/**
 * Verify Razorpay payment signature
 * @param {string} razorpayOrderId - Razorpay order ID
 * @param {string} razorpayPaymentId - Razorpay payment ID
 * @param {string} razorpaySignature - Razorpay signature
 * @returns {boolean} - True if signature is valid
 */
export const verifyPaymentSignature = (
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature
) => {
    try {
        const body = razorpayOrderId + '|' + razorpayPaymentId;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        return expectedSignature === razorpaySignature;
    } catch (error) {
        console.error('Razorpay signature verification error:', error);
        return false;
    }
};

/**
 * Fetch payment details from Razorpay
 * @param {string} paymentId - Razorpay payment ID
 * @returns {Promise<Object>} - Payment details
 */
export const fetchPaymentDetails = async (paymentId) => {
    try {
        const payment = await razorpayInstance.payments.fetch(paymentId);
        return payment;
    } catch (error) {
        console.error('Razorpay fetch payment error:', error);
        throw new Error('Failed to fetch payment details');
    }
};

/**
 * Create refund for a payment
 * @param {string} paymentId - Razorpay payment ID
 * @param {number} amount - Amount to refund in rupees (optional, full refund if not specified)
 * @returns {Promise<Object>} - Refund object
 */
export const createRefund = async (paymentId, amount = null) => {
    try {
        const options = amount ? { amount: Math.round(amount * 100) } : {};
        const refund = await razorpayInstance.payments.refund(paymentId, options);
        return refund;
    } catch (error) {
        console.error('Razorpay refund error:', error);
        throw new Error('Failed to create refund');
    }
};

export default razorpayInstance;
