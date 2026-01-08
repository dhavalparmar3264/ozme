import Razorpay from 'razorpay';
import crypto from 'crypto';

// Lazy initialization - only create instance when needed
let razorpayInstance = null;

/**
 * Get or create Razorpay instance (lazy initialization)
 * @returns {Object} Razorpay instance
 * @throws {Error} If Razorpay credentials are not configured
 */
const getRazorpayInstance = () => {
    if (!razorpayInstance) {
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        if (!keyId || !keySecret) {
            throw new Error(
                'Razorpay credentials not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env file.'
            );
        }

        razorpayInstance = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
        });
    }

    return razorpayInstance;
};

/**
 * Create Razorpay order
 * @param {number} amount - Amount in rupees (will be converted to paise)
 * @param {string} orderId - Our internal order ID for reference
 * @returns {Promise<Object>} - Razorpay order object
 */
export const createRazorpayOrder = async (amount, orderId) => {
    try {
        const instance = getRazorpayInstance();
        const options = {
            amount: Math.round(amount * 100), // Convert to paise
            currency: 'INR',
            receipt: orderId,
            payment_capture: 1, // Auto capture payment
        };

        const order = await instance.orders.create(options);
        return order;
    } catch (error) {
        console.error('Razorpay create order error:', error);
        
        // Handle different error structures from Razorpay
        if (error.statusCode === 401 || (error.error && error.error.code === 'BAD_REQUEST_ERROR')) {
            console.error('❌ Razorpay Authentication Failed!');
            console.error('💡 Check your Razorpay credentials in .env:');
            console.error(`   RAZORPAY_KEY_ID: ${process.env.RAZORPAY_KEY_ID ? '✓ Set' : '✗ Missing'}`);
            console.error(`   RAZORPAY_KEY_SECRET: ${process.env.RAZORPAY_KEY_SECRET ? '✓ Set' : '✗ Missing'}`);
            console.error('📝 Solution:');
            console.error('   1. Go to: https://dashboard.razorpay.com');
            console.error('   2. Go to: Settings → API Keys');
            console.error('   3. Copy your Key ID and Key Secret');
            console.error('   4. Update RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env');
            throw new Error('Razorpay authentication failed. Please check your API keys in .env file.');
        }
        
        if (error.message && error.message.includes('not configured')) {
            throw error;
        }
        
        const errorMessage = error.message || (error.error && error.error.description) || 'Unknown error';
        throw new Error('Failed to create Razorpay order: ' + errorMessage);
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
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        
        if (!keySecret) {
            console.error('Razorpay key secret not configured');
            return false;
        }

        const body = razorpayOrderId + '|' + razorpayPaymentId;
        const expectedSignature = crypto
            .createHmac('sha256', keySecret)
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
        const instance = getRazorpayInstance();
        const payment = await instance.payments.fetch(paymentId);
        return payment;
    } catch (error) {
        console.error('Razorpay fetch payment error:', error);
        if (error.message && error.message.includes('not configured')) {
            throw error;
        }
        const errorMessage = error.message || (error.error && error.error.description) || 'Unknown error';
        throw new Error('Failed to fetch payment details: ' + errorMessage);
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
        const instance = getRazorpayInstance();
        const options = amount ? { amount: Math.round(amount * 100) } : {};
        const refund = await instance.payments.refund(paymentId, options);
        return refund;
    } catch (error) {
        console.error('Razorpay refund error:', error);
        if (error.message && error.message.includes('not configured')) {
            throw error;
        }
        const errorMessage = error.message || (error.error && error.error.description) || 'Unknown error';
        throw new Error('Failed to create refund: ' + errorMessage);
    }
};

// Export lazy getter for backward compatibility
export default {
    getInstance: getRazorpayInstance,
};
