import crypto from 'crypto';

/**
 * Cashfree Payment Gateway Utility
 * Handles payment session creation, webhook verification, and payment status checks
 */

// Get Cashfree credentials from environment
const getCashfreeConfig = () => {
  const clientId = process.env.CASHFREE_CLIENT_ID;
  const clientSecret = process.env.CASHFREE_CLIENT_SECRET;
  const environment = process.env.CASHFREE_ENVIRONMENT || 'production'; // 'sandbox' or 'production'
  const webhookSecret = process.env.CASHFREE_WEBHOOK_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      'Cashfree credentials not configured. Please set CASHFREE_CLIENT_ID and CASHFREE_CLIENT_SECRET in your .env file.'
    );
  }

  const baseURL = environment === 'sandbox' 
    ? 'https://sandbox.cashfree.com/pg'
    : 'https://api.cashfree.com/pg';

  return {
    clientId,
    clientSecret,
    baseURL,
    webhookSecret,
    environment,
  };
};

/**
 * Get Cashfree API authentication headers
 * @returns {Object} Headers with authorization
 */
const getAuthHeaders = () => {
  const config = getCashfreeConfig();
  return {
    'x-client-id': config.clientId,
    'x-client-secret': config.clientSecret,
    'x-api-version': '2023-08-01', // Cashfree API version
    'Content-Type': 'application/json',
  };
};

/**
 * Create Cashfree payment session
 * @param {number} amount - Amount in rupees
 * @param {string} orderId - Internal order ID
 * @param {Object} customerDetails - Customer information
 * @param {Object} orderMeta - Order metadata
 * @returns {Promise<Object>} Payment session details
 */
export const createCashfreePaymentSession = async (amount, orderId, customerDetails = {}, orderMeta = {}) => {
  try {
    const config = getCashfreeConfig();
    const amountInPaise = Math.round(amount * 100); // Convert to paise

    const payload = {
      order_amount: amountInPaise,
      order_currency: 'INR',
      order_id: orderId,
      customer_details: {
        customer_id: customerDetails.customerId || `customer_${orderId}`,
        customer_name: customerDetails.name || 'Customer',
        customer_email: customerDetails.email || '',
        customer_phone: customerDetails.phone || '',
        ...customerDetails,
      },
      order_meta: {
        return_url: orderMeta.returnUrl || `${process.env.CLIENT_URL || 'https://ozme.in'}/order-success?order_id={order_id}`,
        notify_url: orderMeta.notifyUrl || `${process.env.API_BASE_URL || 'https://ozme.in/api'}/payments/cashfree/webhook`,
        payment_methods: 'cc,dc,upi,nb,app,paylater', // Valid Cashfree payment methods: cc,dc,ppc,ccc,emi,paypal,upi,nb,app,paylater,applepay
        ...orderMeta,
      },
    };

    const response = await fetch(`${config.baseURL}/orders`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      const errorData = responseData || {};
      const errorMessage = errorData.message || errorData.error_description || `HTTP ${response.status}`;
      
      if (response.status === 401 || response.status === 403) {
        console.error('❌ Cashfree Authentication Failed!');
        console.error('💡 Check your Cashfree credentials in .env:');
        console.error(`   CASHFREE_CLIENT_ID: ${process.env.CASHFREE_CLIENT_ID ? '✓ Set' : '✗ Missing'}`);
        console.error(`   CASHFREE_CLIENT_SECRET: ${process.env.CASHFREE_CLIENT_SECRET ? '✓ Set' : '✗ Missing'}`);
        console.error(`   CASHFREE_ENVIRONMENT: ${process.env.CASHFREE_ENVIRONMENT || 'production (default)'}`);
        throw new Error('Cashfree authentication failed. Please check your API credentials in .env file.');
      }
      
      throw new Error(`Failed to create Cashfree payment session: ${errorMessage}`);
    }

    if (responseData && responseData.payment_session_id) {
      return {
        payment_session_id: responseData.payment_session_id,
        order_id: responseData.order_id,
        order_amount: responseData.order_amount,
        order_currency: responseData.order_currency,
        payment_link: responseData.payment_link || null,
      };
    }

    throw new Error('Invalid response from Cashfree API');
  } catch (error) {
    console.error('Cashfree create payment session error:', error);
    
    if (error.message && error.message.includes('not configured')) {
      throw error;
    }
    
    throw new Error(`Failed to create Cashfree payment session: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Verify Cashfree webhook signature
 * @param {Object} webhookPayload - Webhook payload from Cashfree
 * @param {string} signature - Webhook signature from headers
 * @returns {boolean} True if signature is valid
 */
export const verifyCashfreeWebhookSignature = (webhookPayload, signature) => {
  try {
    const config = getCashfreeConfig();
    
    if (!config.webhookSecret) {
      console.warn('⚠️  CASHFREE_WEBHOOK_SECRET not configured - webhook signature verification skipped');
      return true; // Allow if webhook secret not configured (for development)
    }

    // Cashfree webhook signature verification
    // Signature is HMAC SHA256 of payload JSON string
    const payloadString = typeof webhookPayload === 'string' 
      ? webhookPayload 
      : JSON.stringify(webhookPayload);
    
    const expectedSignature = crypto
      .createHmac('sha256', config.webhookSecret)
      .update(payloadString)
      .digest('hex');

    return expectedSignature === signature;
  } catch (error) {
    console.error('Cashfree webhook signature verification error:', error);
    return false;
  }
};

/**
 * Fetch payment status from Cashfree
 * @param {string} orderId - Cashfree order ID (or our internal order ID)
 * @returns {Promise<Object>} Payment status details
 */
export const fetchCashfreePaymentStatus = async (orderId) => {
  try {
    const config = getCashfreeConfig();

    const response = await fetch(`${config.baseURL}/orders/${orderId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const responseData = await response.json();

    if (!response.ok) {
      const errorData = responseData || {};
      const errorMessage = errorData.message || `HTTP ${response.status}`;
      
      if (response.status === 404) {
        throw new Error(`Order not found: ${orderId}`);
      }
      
      throw new Error(`Failed to fetch payment status: ${errorMessage}`);
    }

    if (responseData) {
      return {
        order_id: responseData.order_id,
        order_amount: responseData.order_amount,
        order_currency: responseData.order_currency,
        order_status: responseData.order_status, // 'PAID', 'ACTIVE', 'EXPIRED', etc.
        payment_session_id: responseData.payment_session_id,
        payment_details: responseData.payment_details || {},
      };
    }

    throw new Error('Invalid response from Cashfree API');
  } catch (error) {
    console.error('Cashfree fetch payment status error:', error);
    throw new Error(`Failed to fetch payment status: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Get payment link for Cashfree checkout
 * @param {string} paymentSessionId - Payment session ID
 * @returns {string} Payment checkout URL
 */
export const getCashfreeCheckoutUrl = (paymentSessionId) => {
  const config = getCashfreeConfig();
  const baseCheckoutURL = config.environment === 'sandbox'
    ? 'https://sandbox.cashfree.com/pg/checkout'
    : 'https://www.cashfree.com/checkout/post/submit';
  
  return `${baseCheckoutURL}?session_id=${paymentSessionId}`;
};

export default {
  createPaymentSession: createCashfreePaymentSession,
  verifyWebhookSignature: verifyCashfreeWebhookSignature,
  fetchPaymentStatus: fetchCashfreePaymentStatus,
  getCheckoutUrl: getCashfreeCheckoutUrl,
};

