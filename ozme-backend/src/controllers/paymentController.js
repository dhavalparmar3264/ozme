import { createRazorpayOrder, verifyPaymentSignature, fetchPaymentDetails } from '../utils/razorpay.js';
import { 
  createCashfreePaymentSession, 
  verifyCashfreeWebhookSignature, 
  fetchCashfreePaymentStatus,
} from '../utils/cashfree.js';
import {
  createPhonePePayment,
  verifyPhonePeCallback,
  getPhonePeStatus,
} from '../utils/phonepe.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { sendOrderConfirmationEmail, sendAdminOrderNotification } from '../utils/orderEmails.js';

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

          const orderedSize = orderItem.size || '120ML';
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

        // Step 3: Send confirmation emails (after order is confirmed)
        // Email failure should not break the payment verification flow
        // Send customer confirmation email (non-blocking)
        try {
            await sendOrderConfirmationEmail(order, order.user);
        } catch (emailError) {
            console.error('❌ Failed to send order confirmation email to customer:', emailError.message || emailError);
            // Don't fail the payment verification if email fails
        }

        // Send admin notification email (non-blocking)
        try {
            await sendAdminOrderNotification(order);
        } catch (emailError) {
            console.error('❌ Failed to send admin order notification email:', emailError.message || emailError);
            // Don't fail the payment verification if email fails
        }

        // Step 4: Return success response (order is confirmed regardless of email status)
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

/**
 * @desc    Create Cashfree payment session
 * @route   POST /api/payments/cashfree/create
 * @access  Private
 */
export const createCashfreePayment = async (req, res) => {
    try {
        const { orderId, amount, customerDetails } = req.body;

        console.log('📥 Cashfree payment request received:', {
            orderId,
            amount,
            hasCustomerDetails: !!customerDetails,
        });

        if (!orderId || !amount) {
            console.error('❌ Missing required fields:', { orderId: !!orderId, amount: !!amount });
            return res.status(400).json({
                success: false,
                message: 'Order ID and amount are required',
            });
        }

        // Verify order exists and populate products
        const order = await Order.findById(orderId)
            .populate('user')
            .populate('items.product');
        if (!order) {
            console.error(`❌ Order not found: ${orderId}`);
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        console.log(`✅ Order found: ${order.orderNumber}`);

        // Prepare customer details
        const customerInfo = customerDetails || {
            name: order.shippingAddress?.name || order.user?.name || 'Customer',
            email: order.shippingAddress?.email || order.user?.email || '',
            phone: order.shippingAddress?.phone || order.user?.phone || '',
            customerId: order.user?._id?.toString() || `customer_${orderId}`,
        };

        console.log('📧 Customer info prepared:', {
            name: customerInfo.name,
            email: customerInfo.email,
            phone: customerInfo.phone ? '***' : 'missing',
        });

        // Check Cashfree PROD configuration
        const hasCashfreeConfig = process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY;
        if (!hasCashfreeConfig) {
            console.error('❌ Cashfree PROD credentials not configured!');
            console.error('   CASHFREE_APP_ID:', process.env.CASHFREE_APP_ID ? '✓ Set' : '✗ Missing');
            console.error('   CASHFREE_SECRET_KEY:', process.env.CASHFREE_SECRET_KEY ? '✓ Set' : '✗ Missing');
            return res.status(500).json({
                success: false,
                message: 'Payment gateway not configured. Please contact support.',
                error: 'Cashfree PROD credentials missing',
            });
        }

        console.log('🔄 Creating Cashfree payment session...');
        
        // CRITICAL: Backend is the single source of truth for payable amount
        // DO NOT trust client-provided amount - recompute from DB products
        
        // Recompute total from order items (using product prices from DB)
        // CRITICAL: Backend is single source of truth - recompute from DB products
        let computedTotalRupees = 0;
        
        // Order items are already populated from the query above
        const orderItemsWithProducts = order.items || [];
        
        if (orderItemsWithProducts.length === 0) {
            console.error('❌ Order has no items:', orderId);
            return res.status(400).json({
                success: false,
                message: 'Order has no items',
            });
        }
        
        for (const orderItem of orderItemsWithProducts) {
            const product = orderItem.product;
            if (!product) {
                console.error(`❌ Product not found for order item: ${orderItem.product}`);
                return res.status(400).json({
                    success: false,
                    message: 'Product not found in order',
                });
            }
            
            // Get price from product (same field used on product page)
            let itemPrice = 0;
            const orderedSize = (orderItem.size || '120ML').toUpperCase();
            
            // Check if product has sizes array
            if (product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0) {
                const sizeObj = product.sizes.find(s => 
                    s.size && s.size.toUpperCase() === orderedSize
                );
                if (sizeObj && sizeObj.price) {
                    itemPrice = sizeObj.price; // Use size-specific price
                } else {
                    itemPrice = product.price; // Fallback to main price
                }
            } else {
                itemPrice = product.price; // Use main product price
            }
            
            const itemQuantity = orderItem.quantity || 1;
            const itemTotal = itemPrice * itemQuantity;
            computedTotalRupees += itemTotal;
            
            console.log('📦 Order item:', {
                productName: product.name?.substring(0, 30) + '...',
                size: orderedSize,
                pricePerUnit: itemPrice,
                quantity: itemQuantity,
                itemTotal: itemTotal,
            });
        }
        
        // Apply discount from order (if any)
        const discountAmount = order.discountAmount || 0;
        computedTotalRupees = Math.max(0, computedTotalRupees - discountAmount);
        
        // Shipping cost (free shipping)
        const shippingCost = 0;
        const finalTotalRupees = computedTotalRupees + shippingCost;
        
        // CRITICAL VALIDATION: Hard safety guards before calling Cashfree
        // Guard 1: Amount must be > 0
        if (finalTotalRupees <= 0) {
            console.error('❌ Invalid computed total:', finalTotalRupees);
            return res.status(400).json({
                success: false,
                message: 'Invalid order total',
            });
        }
        
        // Guard 2: Amount must be reasonable (₹1 - ₹10,000 for normal carts)
        if (finalTotalRupees > 10000) {
            console.error('❌ Amount suspiciously high:', {
                amountRupees: finalTotalRupees,
                expectedRange: '₹1 - ₹10,000',
                orderId,
            });
            return res.status(400).json({
                success: false,
                message: 'Amount suspicious. Please contact support.',
            });
        }
        
        // Guard 3: Detect 100x mistakes (amount divisible by 100 and > 1000)
        // Example: 79900 looks like paise sent as rupees (should be 799)
        if (finalTotalRupees > 1000 && finalTotalRupees % 100 === 0 && Number.isInteger(finalTotalRupees)) {
            const possibleCorrectAmount = finalTotalRupees / 100;
            // If divided amount is reasonable (₹1 - ₹10,000), it's likely a 100x error
            if (possibleCorrectAmount >= 1 && possibleCorrectAmount <= 10000) {
                console.error('❌ Amount unit mismatch detected (likely paise sent as rupees):', {
                    computedAmount: finalTotalRupees,
                    possibleCorrectAmount: possibleCorrectAmount,
                    orderId,
                });
                return res.status(500).json({
                    success: false,
                    message: 'Amount unit mismatch detected. Please contact support.',
                    error: 'Amount unit mismatch',
                });
            }
        }
        
        // Guard 4: Final validation - amount must be at least ₹1
        if (finalTotalRupees < 1) {
            console.error('❌ Amount too low:', {
                amountRupees: finalTotalRupees,
                orderId,
            });
            return res.status(400).json({
                success: false,
                message: 'Invalid order amount',
            });
        }
        
        // Compare with frontend amount (for logging only - backend amount is authoritative)
        const frontendAmountRupees = amount;
        const amountDifference = Math.abs(finalTotalRupees - frontendAmountRupees);
        if (amountDifference > 1) {
            console.warn('⚠️  Frontend amount mismatch (using backend computed amount):', {
                backendComputedAmount: finalTotalRupees,
                frontendAmount: frontendAmountRupees,
                difference: amountDifference,
            });
        }
        
        // Log amount computation (safe - no secrets)
        console.log('💰 Cashfree amount computation:', {
            orderId: orderId.toString().substring(0, 10) + '...',
            computedTotalRupees: finalTotalRupees,
            discountAmount: discountAmount,
            shippingCost: shippingCost,
            willBeSentToCashfree: finalTotalRupees, // Cashfree expects RUPEES, not paise
        });
        
        // Generate unique attempt ID and Cashfree order_id (must be unique per order)
        const now = new Date();
        const attemptId = `attempt_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const cashfreeOrderId = `OZME_${orderId.toString()}_${attemptId}`;
        
        // Create Cashfree payment session
        // CRITICAL: Pass amount in RUPEES - Cashfree Orders API expects RUPEES (NOT paise)
        const paymentSession = await createCashfreePaymentSession(
            finalTotalRupees, // Amount in RUPEES (e.g., 799 for ₹799)
            cashfreeOrderId,
            customerInfo,
            {
                returnUrl: process.env.CASHFREE_RETURN_URL?.replace('{order_id}', orderId.toString()) || `${process.env.CLIENT_URL || 'https://ozme.in'}/checkout/success?order_id=${orderId}`,
                notifyUrl: process.env.CASHFREE_CALLBACK_URL || `${process.env.API_BASE_URL || 'https://www.ozme.in'}/api/payments/cashfree/webhook`,
            }
        );
        
        // Create payment attempt record
        const newAttempt = {
            attemptId: attemptId,
            cashfreeOrderId: paymentSession.order_id,
            paymentSessionId: paymentSession.payment_session_id,
            initiatedAt: now,
            status: 'PENDING',
        };

        if (!order.paymentAttempts) {
            order.paymentAttempts = [];
        }
        order.paymentAttempts.push(newAttempt);

        // Store Cashfree order_id and payment timestamps
        order.cashfreeOrderId = paymentSession.order_id;
        order.paymentInitiatedAt = now;
        order.lastPaymentAttemptAt = now;
        await order.save();

        console.log('✅ Cashfree payment session created:', {
            payment_session_id: paymentSession.payment_session_id,
            order_id: paymentSession.order_id,
        });

        // Return response with amount in rupees for frontend validation
        res.status(200).json({
            success: true,
            data: {
                payment_session_id: paymentSession.payment_session_id,
                order_id: paymentSession.order_id,
                amountRupees: finalTotalRupees, // Amount in RUPEES (e.g., 799 for ₹799)
                currency: paymentSession.order_currency || 'INR',
            },
        });
    } catch (error) {
        console.error('❌ Create Cashfree payment error:', error);
        console.error('   Error message:', error.message);
        console.error('   Error stack:', error.stack);
        console.error('   Request body:', req.body);
        
        // Provide more helpful error messages
        let errorMessage = 'Failed to create payment session';
        let statusCode = 500;
        
        if (error.message && error.message.includes('not configured')) {
            errorMessage = 'Payment gateway not configured. Please contact support.';
            statusCode = 503; // Service Unavailable
        } else if (error.message && error.message.includes('authentication failed')) {
            errorMessage = 'Payment gateway authentication failed. Please contact support.';
            statusCode = 503;
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        res.status(statusCode).json({
            success: false,
            message: errorMessage,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};

/**
 * @desc    Handle Cashfree webhook
 * @route   POST /api/payments/cashfree/webhook
 * @access  Public (webhook) - Authenticated via signature verification
 * @note    Verifies signature before processing, returns 200 OK after successful processing
 */
export const handleCashfreeWebhook = async (req, res) => {
    try {
        // Get raw body (Buffer from middleware)
        const rawBody = req.body instanceof Buffer ? req.body : Buffer.from(JSON.stringify(req.body));
        
        // Get signature from x-webhook-signature header
        const signature = req.headers['x-webhook-signature'];
        
        // Verify webhook signature FIRST (security check)
        if (!signature) {
            console.error('❌ Cashfree webhook: Missing x-webhook-signature header');
            return res.status(401).json({
                success: false,
                message: 'Missing webhook signature',
            });
        }

        const isValid = verifyCashfreeWebhookSignature(rawBody, signature);
        
        if (!isValid) {
            console.error('❌ Cashfree webhook: Invalid signature - rejecting');
            return res.status(401).json({
                success: false,
                message: 'Invalid webhook signature',
            });
        }

        // Parse webhook payload (after signature verification)
        let webhookData;
        try {
            const payloadString = rawBody instanceof Buffer ? rawBody.toString('utf8') : rawBody;
            webhookData = typeof payloadString === 'string' ? JSON.parse(payloadString) : payloadString;
        } catch (parseError) {
            console.error('❌ Cashfree webhook: Failed to parse body:', parseError.message);
            return res.status(400).json({
                success: false,
                message: 'Invalid webhook payload',
            });
        }

        // Extract webhook data
        const eventType = webhookData.type || webhookData.event || 'unknown';
        const cashfreeOrderId = webhookData.data?.order?.order_id || webhookData.order_id;
        const orderStatus = webhookData.data?.order?.order_status || webhookData.order_status;
        const paymentStatus = webhookData.data?.payment?.payment_status || webhookData.payment_status;

        // Safe logging (no secrets)
        console.log('📥 Cashfree webhook received:', {
            eventType,
            cashfreeOrderId: cashfreeOrderId?.substring(0, 30) + (cashfreeOrderId?.length > 30 ? '...' : ''),
            orderStatus,
            paymentStatus,
        });

        if (!cashfreeOrderId) {
            console.warn('⚠️  Cashfree webhook: Missing order_id');
            // Return 200 OK even if order_id missing (prevent retries)
            return res.status(200).json({
                success: true,
                message: 'Webhook received but order_id missing',
            });
        }

        // Find order by cashfreeOrderId in paymentAttempts array (validate attemptId)
        let order = null;
        let matchingAttempt = null;

        // First, try to find order by current cashfreeOrderId
        order = await Order.findOne({ cashfreeOrderId }).populate('items.product user');

        // If not found, search in paymentAttempts array
        if (!order) {
            // Extract attemptId from cashfreeOrderId format: OZME_{orderId}_{attemptId}
            if (cashfreeOrderId.startsWith('OZME_')) {
                const parts = cashfreeOrderId.split('_');
                if (parts.length >= 3) {
                    const internalOrderId = parts[1];
                    const attemptId = parts.slice(2).join('_'); // Handle attemptId that might contain underscores
                    
                    order = await Order.findById(internalOrderId).populate('items.product user');
                    if (order && order.paymentAttempts) {
                        // Find matching attempt
                        matchingAttempt = order.paymentAttempts.find(
                            attempt => attempt.cashfreeOrderId === cashfreeOrderId || 
                                      attempt.attemptId === attemptId ||
                                      attempt.cashfreeOrderId?.endsWith(attemptId)
                        );
                        
                        if (!matchingAttempt) {
                            // Try to find by exact cashfreeOrderId match in attempts
                            matchingAttempt = order.paymentAttempts.find(
                                attempt => attempt.cashfreeOrderId === cashfreeOrderId
                            );
                        }
                    }
                } else if (parts.length >= 2) {
                    // Fallback: old format OZME_{orderId}
                    const internalOrderId = parts[1];
                    order = await Order.findById(internalOrderId).populate('items.product user');
                }
            }
        } else {
            // Order found by cashfreeOrderId, find matching attempt
            if (order.paymentAttempts) {
                matchingAttempt = order.paymentAttempts.find(
                    attempt => attempt.cashfreeOrderId === cashfreeOrderId
                );
            }
        }

        if (!order) {
            console.warn(`⚠️  Cashfree webhook: Order not found for order_id: ${cashfreeOrderId}`);
            // Return 200 OK even if order not found (prevent retries)
            return res.status(200).json({
                success: true,
                message: 'Webhook received but order not found',
            });
        }

        // CRITICAL: Validate that this webhook is for the current/latest attempt
        // Ignore webhooks from old/cancelled attempts
        if (matchingAttempt) {
            if (matchingAttempt.status === 'CANCELLED' || matchingAttempt.status === 'FAILED') {
                console.log(`⚠️  Cashfree webhook: Ignoring webhook for cancelled/failed attempt: ${matchingAttempt.attemptId}`);
                return res.status(200).json({
                    success: true,
                    message: 'Webhook received for cancelled/failed attempt - ignored',
                });
            }
        } else {
            // No matching attempt found - this might be an old webhook
            // Check if order has a current attempt that doesn't match
            if (order.paymentAttempts && order.paymentAttempts.length > 0) {
                const latestAttempt = order.paymentAttempts[order.paymentAttempts.length - 1];
                if (latestAttempt.cashfreeOrderId !== cashfreeOrderId && latestAttempt.status === 'PENDING') {
                    console.log(`⚠️  Cashfree webhook: Ignoring webhook for stale attempt. Current attempt: ${latestAttempt.attemptId}`);
                    return res.status(200).json({
                        success: true,
                        message: 'Webhook received for stale attempt - ignored',
                    });
                }
            }
        }

        // Handle payment success
        if (orderStatus === 'PAID' || paymentStatus === 'SUCCESS') {
            // Check if already processed (idempotency)
            if (order.paymentStatus === 'Paid' && order.orderStatus !== 'Pending') {
                console.log(`✅ Order ${order._id} already processed - idempotent skip`);
                return res.status(200).json({
                    success: true,
                    message: 'Order already processed',
                });
            }

            // Update matching attempt status
            if (matchingAttempt) {
                matchingAttempt.status = 'SUCCESS';
                matchingAttempt.completedAt = new Date();
            }

            // Reduce product stock (same logic as Razorpay)
            const orderItems = order.items || [];
            
            for (const orderItem of orderItems) {
                try {
                    const product = await Product.findById(orderItem.product);
                    if (!product) {
                        console.error(`⚠️  Product with ID ${orderItem.product} not found during stock reduction`);
                        continue;
                    }

                    const orderedSize = orderItem.size || '120ML';
                    const orderedQuantity = orderItem.quantity || 1;

                    if (product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0) {
                        const sizeIndex = product.sizes.findIndex(s => 
                            s.size && s.size.toUpperCase() === orderedSize.toUpperCase()
                        );

                        if (sizeIndex !== -1) {
                            const currentStock = product.sizes[sizeIndex].stockQuantity || 0;
                            
                            if (currentStock >= orderedQuantity) {
                                product.sizes[sizeIndex].stockQuantity = currentStock - orderedQuantity;
                                product.sizes[sizeIndex].inStock = (product.sizes[sizeIndex].stockQuantity || 0) > 0;
                                product.stockQuantity = product.sizes.reduce((sum, s) => sum + (s.stockQuantity || 0), 0);
                                product.inStock = product.sizes.some(s => s.inStock !== false && (s.stockQuantity || 0) > 0);
                                await product.save();
                            }
                        }
                    } else {
                        const currentStock = product.stockQuantity || 0;
                        if (currentStock >= orderedQuantity) {
                            product.stockQuantity = currentStock - orderedQuantity;
                            product.inStock = product.stockQuantity > 0;
                            await product.save();
                        }
                    }
                } catch (stockError) {
                    console.error('⚠️  Stock reduction error:', stockError.message);
                    // Continue processing other items
                }
            }

            // Extract payment method type from webhook
            const paymentMethodType = webhookData.data?.payment?.payment_method || 
                                     webhookData.payment?.payment_method || 
                                     webhookData.data?.payment_method ||
                                     null;
            
            // Map Cashfree payment method codes to readable names
            let paymentMethodDisplay = null;
            if (paymentMethodType) {
              const methodMap = {
                'upi': 'UPI',
                'cc': 'Credit Card',
                'dc': 'Debit Card',
                'nb': 'Net Banking',
                'wallet': 'Wallet',
                'app': 'App',
                'paylater': 'Pay Later',
              };
              paymentMethodDisplay = methodMap[paymentMethodType.toLowerCase()] || paymentMethodType;
            }

            // Update order status
            order.paymentId = webhookData.data?.payment?.payment_id || webhookData.payment_id || 'cashfree_payment';
            order.paymentStatus = 'Paid';
            order.orderStatus = 'Processing';
            if (paymentMethodDisplay) {
              order.paymentMethodType = paymentMethodDisplay;
            }
            await order.save();

            // Send confirmation emails (non-blocking)
            try {
                await sendOrderConfirmationEmail(order, order.user);
            } catch (emailError) {
                console.error('⚠️  Failed to send order confirmation email:', emailError.message);
            }

            try {
                await sendAdminOrderNotification(order);
            } catch (emailError) {
                console.error('⚠️  Failed to send admin order notification:', emailError.message);
            }

            console.log(`✅ Order ${order._id} payment confirmed via Cashfree webhook - Status: ${order.paymentStatus}`);

            // Return 200 OK after successful processing
            return res.status(200).json({
                success: true,
                message: 'Webhook processed successfully',
            });
        } else if (orderStatus === 'ACTIVE' || orderStatus === 'EXPIRED' || paymentStatus === 'FAILED' || paymentStatus === 'CANCELLED') {
            // Payment pending, expired, failed, or cancelled
            const newStatus = orderStatus === 'EXPIRED' || paymentStatus === 'FAILED' || paymentStatus === 'CANCELLED' 
                ? 'Failed' 
                : 'Pending';
            
            // Only update if this is for the current attempt
            if (matchingAttempt && matchingAttempt.status === 'PENDING') {
                matchingAttempt.status = orderStatus === 'EXPIRED' ? 'EXPIRED' : 
                                       paymentStatus === 'CANCELLED' ? 'CANCELLED' : 
                                       paymentStatus === 'FAILED' ? 'FAILED' : 'PENDING';
                if (newStatus === 'Failed') {
                    matchingAttempt.completedAt = new Date();
                }
                
                // Only update order status if this is the latest attempt
                const latestAttempt = order.paymentAttempts[order.paymentAttempts.length - 1];
                if (matchingAttempt.attemptId === latestAttempt.attemptId) {
                    order.paymentStatus = newStatus;
                    if (newStatus === 'Failed') {
                        order.failureReason = orderStatus === 'EXPIRED' ? 'EXPIRED' : 
                                           paymentStatus === 'CANCELLED' ? 'CANCELLED' : 'FAILED';
                    }
                }
            }
            
            await order.save();
            console.log(`📝 Order ${order._id} status updated: ${order.paymentStatus}`);

            // Return 200 OK
            return res.status(200).json({
                success: true,
                message: 'Webhook processed successfully',
            });
        } else {
            // Unknown status - log but return 200 OK
            console.log(`📝 Order ${order._id} received webhook with status: ${orderStatus || paymentStatus || 'unknown'}`);
            return res.status(200).json({
                success: true,
                message: 'Webhook received',
            });
        }
    } catch (error) {
        // Log error but return 200 OK to prevent retries
        console.error('❌ Cashfree webhook processing error:', error.message);
        console.error('   Stack:', error.stack?.substring(0, 200));
        
        return res.status(200).json({
            success: false,
            message: 'Webhook processing error',
        });
    }
};

/**
 * @desc    Get Cashfree payment status
 * @route   GET /api/payments/cashfree/status/:orderId
 * @access  Private
 */
export const getCashfreePaymentStatus = async (req, res) => {
    try {
        const { orderId } = req.params;

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'Order ID is required',
            });
        }

        // Fetch status from Cashfree
        const paymentStatus = await fetchCashfreePaymentStatus(orderId);

        // Also get order from database
        const order = await Order.findById(orderId);

        res.status(200).json({
            success: true,
            data: {
                order_id: paymentStatus.order_id,
                order_status: paymentStatus.order_status,
                payment_status: order?.paymentStatus || 'Pending',
                order_amount: paymentStatus.order_amount,
                order_currency: paymentStatus.order_currency,
                payment_details: paymentStatus.payment_details,
            },
        });
    } catch (error) {
        console.error('Get Cashfree payment status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch payment status',
            error: error.message,
        });
    }
};

/**
 * @desc    Initiate PhonePe payment
 * @route   POST /api/payments/phonepe/create
 * @access  Private
 */
export const initiatePhonePePayment = async (req, res) => {
    try {
        const { orderId, amount, customerDetails } = req.body;

        console.log('📥 PhonePe payment request received:', {
            orderId,
            amount,
            hasCustomerDetails: !!customerDetails,
        });

        if (!orderId || !amount) {
            console.error('❌ Missing required fields:', { orderId: !!orderId, amount: !!amount });
            return res.status(400).json({
                success: false,
                message: 'Order ID and amount are required',
            });
        }

        // Verify order exists and get from DB (trusted source)
        const order = await Order.findById(orderId).populate('user');
        if (!order) {
            console.error(`❌ Order not found: ${orderId}`);
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        console.log(`✅ Order found: ${order.orderNumber}`);

        // Use amount from order (trusted source) instead of request body
        const orderAmount = order.totalAmount;
        const amountPaise = Math.round(orderAmount * 100); // Convert to paise

        // Generate unique merchant transaction ID
        // PhonePe PROD allows: up to 50 characters
        // Format: OZME + last 12 chars of orderId + timestamp (last 10 digits)
        const orderIdShort = orderId.toString().slice(-12); // Last 12 chars of MongoDB ObjectId
        const timestampShort = Date.now().toString().slice(-10); // Last 10 digits of timestamp
        const merchantTransactionId = `OZME${orderIdShort}${timestampShort}`; // Max 50 chars for PROD

        // Prepare customer details
        const customerInfo = customerDetails || {
            name: order.shippingAddress?.name || order.user?.name || 'Customer',
            email: order.shippingAddress?.email || order.user?.email || '',
            phone: order.shippingAddress?.phone || order.user?.phone || '',
        };

        console.log('📧 Customer info prepared:', {
            name: customerInfo.name,
            email: customerInfo.email,
            phone: customerInfo.phone ? '***' : 'missing',
        });

        // Validate PhonePe PROD configuration - SALT_KEY and SALT_INDEX are REQUIRED
        const hasMerchantId = !!process.env.PHONEPE_MERCHANT_ID;
        const hasSaltKey = !!process.env.PHONEPE_SALT_KEY;
        const hasSaltIndex = !!process.env.PHONEPE_SALT_INDEX;
        const phonePeMode = process.env.PHONEPE_MODE || 'PROD';
        
        // CRITICAL: Payment initiation MUST fail if SALT_KEY or SALT_INDEX is missing
        if (!hasMerchantId) {
            console.error('❌ PhonePe PROD MERCHANT_ID not configured!');
            return res.status(500).json({
                success: false,
                message: 'Payment gateway configuration error. Please contact support.',
                error: 'PhonePe PROD MERCHANT_ID missing',
            });
        }

        if (!hasSaltKey) {
            console.error('❌ PhonePe PROD SALT_KEY is REQUIRED but not configured!');
            console.error('   PHONEPE_SALT_KEY:', '✗ Missing (REQUIRED for X-VERIFY signature)');
            console.error('   Payment initiation cannot proceed without SALT_KEY');
            return res.status(500).json({
                success: false,
                message: 'Payment gateway configuration error. Please contact support.',
                error: 'PhonePe PROD SALT_KEY missing (required for signature)',
            });
        }

        if (!hasSaltIndex) {
            console.error('❌ PhonePe PROD SALT_INDEX is REQUIRED but not configured!');
            console.error('   PHONEPE_SALT_INDEX:', '✗ Missing (REQUIRED for X-VERIFY signature)');
            console.error('   Payment initiation cannot proceed without SALT_INDEX');
            return res.status(500).json({
                success: false,
                message: 'Payment gateway configuration error. Please contact support.',
                error: 'PhonePe PROD SALT_INDEX missing (required for signature)',
            });
        }

        if (phonePeMode !== 'PROD') {
            console.error('❌ PhonePe mode must be PROD!');
            console.error('   PHONEPE_MODE:', phonePeMode);
            return res.status(500).json({
                success: false,
                message: 'Payment gateway configuration error. Please contact support.',
                error: `PhonePe mode must be PROD, got: ${phonePeMode}`,
            });
        }

        console.log('✅ PhonePe PROD configuration validated (Pay Page):', {
            mode: 'PROD',
            baseURL: process.env.PHONEPE_BASE_URL || 'https://api.phonepe.com/apis/hermes',
            merchantId: process.env.PHONEPE_MERCHANT_ID?.substring(0, 10) + '...',
            saltKeyLength: process.env.PHONEPE_SALT_KEY?.length || 0,
            saltIndex: process.env.PHONEPE_SALT_INDEX || '1',
            integrationType: 'Pay Page (Checksum/Salt flow)',
            signatureFormat: 'sha256(base64Payload + endpoint + SALT_KEY) + "###" + SALT_INDEX',
        });

        // Prepare redirect and callback URLs from env (PROD only)
        const orderMongoId = order._id.toString(); // MongoDB ObjectId (24-char hex)
        
        // Get redirect URL from env, replace {order_id} placeholder
        const baseRedirectUrl = process.env.PHONEPE_RETURN_URL || `${process.env.CLIENT_URL || 'https://ozme.in'}/checkout/success?order_id={order_id}`;
        let redirectUrl = baseRedirectUrl.includes('{order_id}') 
            ? baseRedirectUrl.replace('{order_id}', orderMongoId)
            : `${baseRedirectUrl}${baseRedirectUrl.includes('?') ? '&' : '?'}order_id=${orderMongoId}`;
        
        // Get callback URL from env
        const callbackUrl = process.env.PHONEPE_CALLBACK_URL || `${process.env.API_BASE_URL || process.env.CLIENT_URL || 'https://www.ozme.in'}/api/payments/phonepe/callback`;
        
        console.log('🔗 PhonePe URLs configured:', {
            redirectUrl: redirectUrl.substring(0, 80) + '...',
            callbackUrl: callbackUrl.substring(0, 80) + '...',
            orderMongoId,
        });

        // DEBUG: Log payment creation details
        console.log('🔍 DEBUG: Initiating PhonePe Payment:', {
            PHONEPE_MODE: process.env.PHONEPE_MODE || 'NOT SET',
            PHONEPE_BASE_URL: process.env.PHONEPE_BASE_URL || 'NOT SET',
            merchantId: process.env.PHONEPE_MERCHANT_ID?.substring(0, 10) + '...',
            clientId: process.env.PHONEPE_CLIENT_ID?.substring(0, 10) + '...',
            redirectUrl: redirectUrl.substring(0, 80) + '...',
            callbackUrl: callbackUrl.substring(0, 80) + '...',
            merchantTransactionId,
            amountPaise,
        });
        
        console.log('🔄 Creating PhonePe payment with final redirectUrl:', redirectUrl);
        
        // Create PhonePe payment
        const phonePeResponse = await createPhonePePayment({
            merchantTransactionId,
            amountPaise,
            userId: order.user?._id?.toString() || `guest_${orderId}`,
            mobileNumber: customerInfo.phone,
            redirectUrl,
            callbackUrl,
        });

        // DEBUG: Log PhonePe response
        console.log('🔍 DEBUG: PhonePe Payment Response:', {
            hasRedirectUrl: !!phonePeResponse.redirectUrl,
            redirectUrl: phonePeResponse.redirectUrl ? phonePeResponse.redirectUrl.substring(0, 150) : 'NOT FOUND',
            merchantTransactionId: phonePeResponse.merchantTransactionId,
        });

        // Update order with payment initiation details
        order.paymentGateway = 'PHONEPE';
        order.paymentStatus = 'Pending';
        order.merchantTransactionId = merchantTransactionId;
        await order.save();

        // Extract checkout URL from PhonePe response - NO FALLBACK
        // PhonePe MUST return a valid redirect URL, otherwise it's an error
        if (!phonePeResponse.redirectUrl) {
            console.error('❌ CRITICAL: PhonePe API did not return redirect URL!');
            console.error('   Response:', JSON.stringify(phonePeResponse).substring(0, 500));
            throw new Error('PhonePe API did not return a valid redirect URL. Payment gateway error.');
        }
        
        const finalRedirectUrl = phonePeResponse.redirectUrl;
        
        // DEBUG: Log final redirect URL
        console.log('🔍 DEBUG: Final Redirect URL:', {
            source: 'PhonePe API Response (authoritative)',
            redirectUrl: finalRedirectUrl.substring(0, 150),
        });
        
        // Parse URL to show domain for verification
        let checkoutDomain = 'unknown';
        try {
            const urlObj = new URL(finalRedirectUrl);
            checkoutDomain = urlObj.hostname;
        } catch (e) {
            console.error('❌ Failed to parse redirect URL:', finalRedirectUrl);
        }

        console.log('✅ PhonePe PROD payment created:', {
            merchantTransactionId,
            orderId: order._id.toString(),
            orderMongoId: orderMongoId,
            environment: 'PROD',
            checkoutDomain: checkoutDomain,
            redirectUrlSentToPhonePe: redirectUrl,
            redirectUrlFromPhonePe: finalRedirectUrl?.substring(0, 100) + '...',
            isProductionURL: checkoutDomain.includes('phonepe.com') && !checkoutDomain.includes('preprod') && !checkoutDomain.includes('sandbox') && !checkoutDomain.includes('testing'),
        });

        // Verify PROD checkout URL (strict validation - reject ALL UAT/simulator indicators)
        const redirectUrlLower = finalRedirectUrl.toLowerCase();
        const isUatUrl = checkoutDomain.includes('preprod') || 
                        checkoutDomain.includes('sandbox') || 
                        checkoutDomain.includes('testing') ||
                        checkoutDomain.includes('uat') ||
                        checkoutDomain.includes('mercury-uat') ||
                        checkoutDomain.includes('api-testing') ||
                        checkoutDomain.includes('merchant-simulator') ||
                        redirectUrlLower.includes('/simulator') ||
                        redirectUrlLower.includes('merchant-simulator') ||
                        redirectUrlLower.includes('mercury-uat') ||
                        redirectUrlLower.includes('pgtest');

        if (isUatUrl) {
            console.error('❌ CRITICAL: PhonePe returned UAT/simulator URL instead of PROD!');
            console.error('   Checkout Domain:', checkoutDomain);
            console.error('   Full URL:', finalRedirectUrl.substring(0, 150));
            console.error('   Detected UAT indicators in URL');
            console.error('   Possible causes:');
            console.error('   1. Merchant account is not activated for PROD in PhonePe dashboard');
            console.error('   2. PHONEPE_MERCHANT_ID is a test/UAT merchant ID');
            console.error('   3. Credentials are UAT credentials (not PROD)');
            console.error('   Action: Verify PHONEPE_MODE=PROD and PROD credentials in .env');
            console.error('   Action: Contact PhonePe support to activate merchant account for PROD');
            throw new Error('Payment gateway is in TEST mode. PhonePe returned UAT/simulator URL. Please contact support to activate PROD merchant account.');
        }

        res.status(200).json({
            success: true,
            data: {
                redirectUrl: finalRedirectUrl, // Use PhonePe's URL, or fallback to ours
                merchantTransactionId,
                orderId: order._id.toString(), // Always return MongoDB ObjectId
                amount: orderAmount,
            },
        });
    } catch (error) {
        console.error('❌ Create PhonePe payment error:', error);
        console.error('   Error message:', error.message);
        console.error('   Error stack:', error.stack);
        console.error('   Request body:', req.body);
        
        // Provide more helpful error messages
        let errorMessage = 'Failed to create payment session';
        let statusCode = 500;
        
        if (error.message && error.message.includes('not configured')) {
            errorMessage = 'Payment gateway not configured. Please contact support.';
            statusCode = 503; // Service Unavailable
        } else if (error.message && error.message.includes('authentication failed')) {
            errorMessage = 'Payment gateway authentication failed. Please contact support.';
            statusCode = 503;
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        res.status(statusCode).json({
            success: false,
            message: errorMessage,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};

/**
 * @desc    Handle PhonePe callback/webhook
 * @route   POST /api/payments/phonepe/callback
 * @access  Public (webhook) - Authenticated via Basic Auth
 */
export const phonepeCallback = async (req, res) => {
    try {
        // Webhook authentication (Basic Auth)
        const webhookUsername = process.env.PHONEPE_WEBHOOK_USERNAME;
        const webhookPassword = process.env.PHONEPE_WEBHOOK_PASSWORD;
        
        if (webhookUsername && webhookPassword) {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Basic ')) {
                console.error('❌ PhonePe webhook missing Basic Auth header');
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized',
                });
            }
            
            const credentials = Buffer.from(authHeader.substring(6), 'base64').toString('utf-8');
            const [username, password] = credentials.split(':');
            
            if (username !== webhookUsername || password !== webhookPassword) {
                console.error('❌ PhonePe webhook invalid credentials');
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized',
                });
            }
        }

        const callbackBody = req.body;

        console.log('📥 PhonePe callback received:', {
            hasBody: !!callbackBody,
            hasAuth: !!(webhookUsername && webhookPassword),
        });

        // Extract merchantTransactionId from callback payload
        // PhonePe sends response in base64 encoded format
        let paymentData = callbackBody;
        if (callbackBody?.response) {
            try {
                paymentData = JSON.parse(Buffer.from(callbackBody.response, 'base64').toString());
            } catch (e) {
                console.error('❌ Failed to decode PhonePe callback response');
                paymentData = callbackBody;
            }
        }

        const merchantTransactionId = paymentData?.merchantTransactionId || paymentData?.data?.merchantTransactionId;

        if (!merchantTransactionId) {
            console.error('❌ PhonePe callback missing merchantTransactionId');
            return res.status(200).json({
                success: false,
                message: 'Missing merchantTransactionId',
            });
        }

        console.log('🔍 PhonePe callback - merchantTransactionId:', merchantTransactionId);

        // CRITICAL: Use status API as source of truth instead of callback payload
        // This ensures we get accurate payment status from PhonePe PROD API
        console.log('📡 Querying PhonePe status API for payment status...');
        const { getPhonePeStatus } = await import('../utils/phonepe.js');
        let statusData;
        try {
            statusData = await getPhonePeStatus(merchantTransactionId);
            console.log('✅ PhonePe status API response:', {
                merchantTransactionId,
                state: statusData.state,
                transactionId: statusData.transactionId,
                responseCode: statusData.responseCode,
            });
        } catch (statusError) {
            console.error('❌ Failed to fetch payment status from PhonePe API:', statusError.message);
            // Still return 200 to prevent retries, but log the error
            return res.status(200).json({
                success: false,
                message: 'Failed to verify payment status',
                error: statusError.message,
            });
        }

        // Use status API response as source of truth
        const state = statusData.state; // SUCCESS, FAILED, PENDING
        const transactionId = statusData.transactionId;
        const responseCode = statusData.responseCode;

        // Find order by merchantTransactionId
        const order = await Order.findOne({ merchantTransactionId }).populate('items.product user');

        if (!order) {
            console.error(`❌ Order not found for merchantTransactionId: ${merchantTransactionId}`);
            return res.status(200).json({
                success: false,
                message: 'Order not found',
            });
        }

        // Handle payment status based on PhonePe status API response (source of truth)
        if (state === 'SUCCESS' || responseCode === 'PAYMENT_SUCCESS') {
            // Idempotency check - prevent duplicate processing
            if (order.paymentStatus === 'Paid' && order.orderStatus !== 'Pending') {
                console.log(`✅ Order ${order._id} already processed (idempotent) - skipping`);
                return res.status(200).json({
                    success: true,
                    message: 'Order already processed',
                    orderId: order._id.toString(),
                    paymentStatus: order.paymentStatus,
                });
            }

            // Reduce product stock (same logic as other payment gateways)
            const orderItems = order.items || [];
            
            for (const orderItem of orderItems) {
                const product = await Product.findById(orderItem.product);
                if (!product) {
                    console.error(`Product with ID ${orderItem.product} not found during stock reduction`);
                    continue;
                }

                const orderedSize = orderItem.size || '120ML';
                const orderedQuantity = orderItem.quantity || 1;

                if (product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0) {
                    const sizeIndex = product.sizes.findIndex(s => 
                        s.size && s.size.toUpperCase() === orderedSize.toUpperCase()
                    );

                    if (sizeIndex !== -1) {
                        const currentStock = product.sizes[sizeIndex].stockQuantity || 0;
                        
                        if (currentStock >= orderedQuantity) {
                            product.sizes[sizeIndex].stockQuantity = currentStock - orderedQuantity;
                            product.sizes[sizeIndex].inStock = (product.sizes[sizeIndex].stockQuantity || 0) > 0;
                            product.stockQuantity = product.sizes.reduce((sum, s) => sum + (s.stockQuantity || 0), 0);
                            product.inStock = product.sizes.some(s => s.inStock !== false && (s.stockQuantity || 0) > 0);
                            await product.save();
                        }
                    }
                } else {
                    const currentStock = product.stockQuantity || 0;
                    if (currentStock >= orderedQuantity) {
                        product.stockQuantity = currentStock - orderedQuantity;
                        product.inStock = product.stockQuantity > 0;
                        await product.save();
                    }
                }
            }

            // Update order status with payment metadata
            order.paymentId = transactionId || order.paymentId || 'phonepe_payment';
            order.paymentStatus = 'Paid';
            order.orderStatus = 'Processing';
            order.paidAt = new Date();
            
            // Store payment metadata (if Order model supports it)
            // Note: Add these fields to Order model if needed: providerReferenceId, paymentMeta
            await order.save();
            
            console.log(`✅ Order ${order._id} payment confirmed via PhonePe callback:`, {
                merchantTransactionId,
                transactionId,
                amount,
                state,
            });

            // Send confirmation emails (non-blocking)
            try {
                await sendOrderConfirmationEmail(order, order.user);
            } catch (emailError) {
                console.error('❌ Failed to send order confirmation email:', emailError.message);
            }

            try {
                await sendAdminOrderNotification(order);
            } catch (emailError) {
                console.error('❌ Failed to send admin order notification:', emailError.message);
            }

            console.log(`✅ Order ${order._id} payment confirmed via PhonePe callback`);
        } else if (state === 'FAILED' || responseCode === 'PAYMENT_FAILED' || responseCode === 'PAYMENT_CANCELLED') {
            // Payment failed or cancelled
            order.paymentStatus = 'Failed';
            await order.save();
            console.log(`❌ Order ${order._id} payment failed via PhonePe callback`);
        }

        // Always return 200 to acknowledge callback receipt
        res.status(200).json({
            success: true,
            message: 'Callback processed successfully',
        });
    } catch (error) {
        console.error('PhonePe callback error:', error);
        // Still return 200 to prevent PhonePe from retrying
        res.status(200).json({
            success: false,
            message: 'Callback processing error',
            error: error.message,
        });
    }
};

/**
 * @desc    Get PhonePe payment status by merchantTransactionId (for frontend success page)
 * @route   GET /api/payments/phonepe/status/:merchantTransactionId
 * @access  Public (called from success page)
 */
export const phonepeGetPaymentStatus = async (req, res) => {
    try {
        const { merchantTransactionId } = req.params;

        if (!merchantTransactionId) {
            return res.status(400).json({
                success: false,
                message: 'Merchant Transaction ID is required',
            });
        }

        console.log('🔍 PhonePe Status Check Request:', {
            merchantTransactionId,
            timestamp: new Date().toISOString(),
        });

        // Query PhonePe API for payment status (PROD)
        const { getPhonePeStatus } = await import('../utils/phonepe.js');
        const statusData = await getPhonePeStatus(merchantTransactionId);

        console.log('📊 PhonePe Status Response:', {
            merchantTransactionId,
            state: statusData.state,
            transactionId: statusData.transactionId,
            amount: statusData.amount,
            responseCode: statusData.responseCode,
        });

        // Find order by merchantTransactionId
        const order = await Order.findOne({ merchantTransactionId });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found for this transaction',
                status: statusData.state,
            });
        }

        // Update order status idempotently (PENDING -> PAID/FAILED)
        const previousStatus = order.paymentStatus;
        let orderUpdated = false;

        if (statusData.state === 'SUCCESS' && order.paymentStatus !== 'Paid') {
            order.paymentStatus = 'Paid';
            order.orderStatus = 'Processing';
            order.paymentId = statusData.transactionId || order.paymentId;
            order.paidAt = new Date();
            await order.save();
            orderUpdated = true;
            console.log(`✅ Order ${order._id} status updated: ${previousStatus} -> Paid`);
        } else if ((statusData.state === 'FAILED' || statusData.responseCode === 'PAYMENT_FAILED') && order.paymentStatus !== 'Failed') {
            order.paymentStatus = 'Failed';
            await order.save();
            orderUpdated = true;
            console.log(`❌ Order ${order._id} status updated: ${previousStatus} -> Failed`);
        } else {
            console.log(`ℹ️  Order ${order._id} status unchanged: ${previousStatus} (idempotent)`);
        }

        res.status(200).json({
            success: true,
            data: {
                merchantTransactionId,
                transactionId: statusData.transactionId,
                state: statusData.state,
                amount: statusData.amount,
                responseCode: statusData.responseCode,
                orderId: order._id.toString(),
                paymentStatus: order.paymentStatus,
                orderStatus: order.orderStatus,
                orderUpdated,
            },
        });
    } catch (error) {
        console.error('❌ PhonePe status check error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check payment status',
            error: error.message,
        });
    }
};

/**
 * @desc    Verify PhonePe payment status (for frontend success page) - Legacy endpoint
 * @route   GET /api/payments/phonepe/verify/:orderId
 * @access  Private
 */
export const phonepeVerifyPayment = async (req, res) => {
    try {
        const { orderId } = req.params;

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'Order ID is required',
            });
        }

        // Find order
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        // If order is already paid, return success
        if (order.paymentStatus === 'Paid') {
            return res.status(200).json({
                success: true,
                data: {
                    orderId: order._id,
                    paymentStatus: 'Paid',
                    orderStatus: order.orderStatus,
                },
            });
        }

        // If no merchantTransactionId, can't verify
        if (!order.merchantTransactionId) {
            return res.status(400).json({
                success: false,
                message: 'Payment transaction ID not found',
            });
        }

        // Fetch status from PhonePe
        const paymentStatus = await getPhonePeStatus(order.merchantTransactionId);

        // Update order if payment succeeded
        if (paymentStatus.state === 'SUCCESS' && order.paymentStatus !== 'Paid') {
            order.paymentStatus = 'Paid';
            order.paymentId = paymentStatus.transactionId || order.paymentId;
            order.orderStatus = 'Processing';
            order.paidAt = new Date();
            await order.save();

            // Send confirmation emails (non-blocking)
            try {
                await sendOrderConfirmationEmail(order, order.user);
            } catch (emailError) {
                console.error('❌ Failed to send order confirmation email:', emailError.message);
            }
        } else if (paymentStatus.state === 'FAILED' && order.paymentStatus !== 'Failed') {
            order.paymentStatus = 'Failed';
            await order.save();
        }

        res.status(200).json({
            success: true,
            data: {
                orderId: order._id,
                paymentStatus: order.paymentStatus,
                orderStatus: order.orderStatus,
                phonePeStatus: paymentStatus.state,
                transactionId: paymentStatus.transactionId,
            },
        });
    } catch (error) {
        console.error('PhonePe verify payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify payment',
            error: error.message,
        });
    }
};

