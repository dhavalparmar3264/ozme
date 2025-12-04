import { createRazorpayOrder, verifyPaymentSignature, fetchPaymentDetails } from '../utils/razorpay.js';
import Order from '../models/Order.js';
import { sendOrderConfirmationEmail } from '../utils/orderEmails.js';

/**
 * @desc    Create Razorpay order
 * @route   POST /api/payments/razorpay/create-order
 * @access  Private
 */
export const createPaymentOrder = async (req, res) => {
    try {
        const { orderId, amount } = req.body;

        if (!orderId || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Order ID and amount are required',
            });
        }

        // Create Razorpay order
        const razorpayOrder = await createRazorpayOrder(amount, orderId);

        res.status(200).json({
            success: true,
            data: {
                orderId: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                keyId: process.env.RAZORPAY_KEY_ID,
            },
        });
    } catch (error) {
        console.error('Create payment order error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create payment order',
            error: error.message,
        });
    }
};

/**
 * @desc    Verify Razorpay payment and update order
 * @route   POST /api/payments/razorpay/verify
 * @access  Private
 */
export const verifyPayment = async (req, res) => {
    try {
        const {
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
            orderId,
        } = req.body;

        if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !orderId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required payment verification parameters',
            });
        }

        // Verify signature
        const isValid = verifyPaymentSignature(
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature
        );

        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment signature',
            });
        }

        // Update order with payment details
        const order = await Order.findById(orderId).populate('items.product user');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        // Fetch payment details from Razorpay
        const paymentDetails = await fetchPaymentDetails(razorpayPaymentId);

        order.paymentId = razorpayPaymentId;
        order.paymentStatus = 'Paid';
        order.orderStatus = 'Processing';
        await order.save();

        // Send order confirmation email
        await sendOrderConfirmationEmail(order, order.user);

        res.status(200).json({
            success: true,
            message: 'Payment verified successfully',
            data: {
                orderId: order._id,
                orderNumber: order.orderNumber,
                paymentId: razorpayPaymentId,
                status: paymentDetails.status,
            },
        });
    } catch (error) {
        console.error('Verify payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify payment',
            error: error.message,
        });
    }
};

/**
 * @desc    Handle payment failure
 * @route   POST /api/payments/razorpay/failed
 * @access  Private
 */
export const handlePaymentFailure = async (req, res) => {
    try {
        const { orderId, error } = req.body;

        if (orderId) {
            const order = await Order.findById(orderId);
            if (order) {
                order.paymentStatus = 'Failed';
                await order.save();
            }
        }

        res.status(200).json({
            success: false,
            message: 'Payment failed',
            error: error || 'Payment was not completed',
        });
    } catch (error) {
        console.error('Handle payment failure error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to handle payment failure',
            error: error.message,
        });
    }
};
