import { createRazorpayOrder, verifyPaymentSignature, fetchPaymentDetails } from '../utils/razorpay.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
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

        // Step 1: Reduce product stock (payment confirmed - order is now confirmed)
        // Check if stock was already reduced (in case of duplicate payment verification)
        const orderItems = order.items || [];
        
        for (const orderItem of orderItems) {
          const product = await Product.findById(orderItem.product);
          if (!product) {
            console.error(`Product with ID ${orderItem.product} not found during stock reduction`);
            continue;
          }

          const orderedSize = orderItem.size || '100ML';
          const orderedQuantity = orderItem.quantity || 1;

          // Check if product has sizes array
          if (product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0) {
            // Find the size in the sizes array
            const sizeIndex = product.sizes.findIndex(s => 
              s.size && s.size.toUpperCase() === orderedSize.toUpperCase()
            );

            if (sizeIndex !== -1) {
              const currentStock = product.sizes[sizeIndex].stockQuantity || 0;
              
              // Only reduce if there's enough stock (prevent double reduction)
              if (currentStock >= orderedQuantity) {
                // Reduce stock for the specific size
                product.sizes[sizeIndex].stockQuantity = currentStock - orderedQuantity;
                product.sizes[sizeIndex].inStock = (product.sizes[sizeIndex].stockQuantity || 0) > 0;

                // Update product-level stock quantity (sum of all sizes)
                product.stockQuantity = product.sizes.reduce((sum, s) => sum + (s.stockQuantity || 0), 0);
                product.inStock = product.sizes.some(s => s.inStock !== false && (s.stockQuantity || 0) > 0);
                
                // Save updated product
                await product.save();
              } else {
                console.warn(`Stock already reduced or insufficient for product ${product.name} (${orderedSize}). Current: ${currentStock}, Required: ${orderedQuantity}`);
              }
            }
          } else {
            // Handle single size product (backward compatibility)
            const currentStock = product.stockQuantity || 0;
            
            // Only reduce if there's enough stock (prevent double reduction)
            if (currentStock >= orderedQuantity) {
              // Reduce stock
              product.stockQuantity = currentStock - orderedQuantity;
              product.inStock = product.stockQuantity > 0;
              
              // Save updated product
              await product.save();
            } else {
              console.warn(`Stock already reduced or insufficient for product ${product.name}. Current: ${currentStock}, Required: ${orderedQuantity}`);
            }
          }
        }

        // Step 2: Confirm order in database (payment success)
        order.paymentId = razorpayPaymentId;
        order.paymentStatus = 'Paid';
        order.orderStatus = 'Processing';
        await order.save();

        // Step 2: Send order confirmation email (after order is confirmed)
        // Email failure should not break the payment verification flow
        try {
            await sendOrderConfirmationEmail(order, order.user);
        } catch (emailError) {
            console.error('Failed to send order confirmation email:', emailError);
            // Don't fail the payment verification if email fails
            // Order is already confirmed and saved to database
        }

        // Step 3: Return success response (order is confirmed regardless of email status)
        res.status(200).json({
            success: true,
            message: 'Payment verified successfully and order confirmed',
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
