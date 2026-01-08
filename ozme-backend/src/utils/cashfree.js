import crypto from 'crypto';

/**
 * Cashfree Payment Gateway Utility
 * Handles payment session creation, webhook verification, and payment status checks
 */

// Get Cashfree credentials from environment (PROD)
const getCashfreeConfig = () => {
  // Use CASHFREE_APP_ID and CASHFREE_SECRET_KEY from .env (PROD credentials)
  const appId = process.env.CASHFREE_APP_ID;
  const secretKey = process.env.CASHFREE_SECRET_KEY;
  const environment = process.env.CASHFREE_ENV || 'PROD';
  const baseURL = process.env.CASHFREE_BASE_URL || 'https://api.cashfree.com/pg';

  if (!appId || !secretKey) {
    throw new Error(
      'Cashfree PROD credentials not configured. Please set CASHFREE_APP_ID and CASHFREE_SECRET_KEY in your .env file.'
    );
  }

  // Validate PROD mode
  if (environment !== 'PROD' && !baseURL.includes('api.cashfree.com')) {
    console.warn('⚠️  Cashfree environment is not PROD. Using:', environment);
  }

  return {
    appId,
    secretKey,
    baseURL,
    environment: 'PROD',
  };
};

/**
 * Get Cashfree API authentication headers (PROD)
 * @returns {Object} Headers with authorization
 */
const getAuthHeaders = () => {
  const config = getCashfreeConfig();
  return {
    'x-client-id': config.appId,
    'x-client-secret': config.secretKey,
    'x-api-version': '2022-09-01', // Cashfree API version
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
    
    // CRITICAL: Cashfree Orders API expects order_amount in RUPEES (major currency unit)
    // DO NOT convert to paise - send amount directly in rupees
    
    // Validate amount is in rupees (reasonable range: ₹1 - ₹100,000)
    if (!amount || amount <= 0) {
      throw new Error('Invalid amount: must be greater than 0');
    }
    
    // CRITICAL VALIDATION: Detect if amount is suspiciously high (might be in paise)
    // If amount > ₹10,000 for a normal cart, it's likely wrong
    if (amount > 10000) {
      console.error('❌ Amount suspiciously high (might be in paise):', {
        receivedAmount: amount,
        expectedRange: '₹1 - ₹10,000',
      });
      throw new Error(`Invalid amount: ${amount} is too high. Expected amount in rupees (₹1 - ₹10,000).`);
    }
    
    // CRITICAL VALIDATION: Detect 100x mistakes
    // If amount is divisible by 100 and > 1000, it might be paise (e.g., 79900 for ₹799)
    if (amount > 1000 && amount % 100 === 0 && Number.isInteger(amount)) {
      const possibleCorrectAmount = amount / 100;
      // If divided amount is reasonable (₹1 - ₹10,000), it's likely a 100x error
      if (possibleCorrectAmount >= 1 && possibleCorrectAmount <= 10000) {
        console.error('❌ Amount unit mismatch detected (likely paise sent as rupees):', {
          receivedAmount: amount,
          possibleCorrectAmount: possibleCorrectAmount,
        });
        throw new Error(`Amount unit mismatch: ${amount} looks like paise. Expected rupees (e.g., ${possibleCorrectAmount}).`);
      }
    }
    
    // Round to 2 decimal places (Cashfree accepts up to 2 decimal places)
    const amountRupees = Math.round(amount * 100) / 100;
    
    // Validate amountRupees is a valid number
    if (isNaN(amountRupees) || amountRupees <= 0) {
      throw new Error(`Invalid amount: ${amountRupees} (must be positive number)`);
    }
    
    // Log amount (safe - no secrets)
    console.log('💰 Cashfree API payload:', {
      orderId: orderId.substring(0, 20) + '...',
      amountRupees: amountRupees,
      currency: 'INR',
    });

    // CRITICAL: Cashfree Orders API expects order_amount in RUPEES (major currency unit)
    // Example: For ₹799, send order_amount: 799 (NOT 79900)
    const payload = {
      order_amount: amountRupees, // Amount in RUPEES (e.g., 799 for ₹799)
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
        return_url: orderMeta.returnUrl || process.env.CASHFREE_RETURN_URL || `${process.env.CLIENT_URL || 'https://ozme.in'}/checkout/success?order_id={order_id}`,
        notify_url: orderMeta.notifyUrl || process.env.CASHFREE_CALLBACK_URL || `${process.env.API_BASE_URL || 'https://www.ozme.in'}/api/payments/cashfree/webhook`,
        payment_methods: 'cc,dc,upi,nb,app,paylater', // Valid Cashfree payment methods
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
 * Verify Cashfree webhook signature (PROD)
 * Uses CASHFREE_WEBHOOK_SECRET (separate from API SECRET_KEY)
 * @param {string|Buffer} rawPayload - Raw webhook payload string or Buffer (must be raw, not parsed)
 * @param {string} signature - Webhook signature from x-webhook-signature header
 * @returns {boolean} True if signature is valid
 */
/**
 * Verify Cashfree order payment status (server-to-server)
 * @param {string} cashfreeOrderId - Cashfree order ID
 * @returns {Promise<Object>} Order status from Cashfree API
 */
export const verifyCashfreeOrderStatus = async (cashfreeOrderId) => {
  try {
    const config = getCashfreeConfig();
    
    const response = await fetch(`${config.baseURL}/orders/${cashfreeOrderId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Cashfree order status API error (${response.status}):`, errorText);
      throw new Error(`Cashfree API error: ${response.status}`);
    }

    const responseData = await response.json();
    
    // Cashfree Orders API response structure
    if (responseData && responseData.order_status) {
      return {
        orderId: responseData.order_id || cashfreeOrderId,
        orderStatus: responseData.order_status, // ACTIVE, PAID, EXPIRED, etc.
        paymentStatus: responseData.payment_status || null, // SUCCESS, PENDING, FAILED, etc.
        orderAmount: responseData.order_amount || null,
        orderCurrency: responseData.order_currency || 'INR',
        paymentSessionId: responseData.payment_session_id || null,
      };
    }

    throw new Error('Invalid response from Cashfree order status API');
  } catch (error) {
    console.error('Cashfree order status verification error:', error);
    throw error;
  }
};

export const verifyCashfreeWebhookSignature = (rawPayload, signature) => {
  try {
    // Use CASHFREE_WEBHOOK_SECRET (separate from CASHFREE_SECRET_KEY)
    const webhookSecret = process.env.CASHFREE_WEBHOOK_SECRET;
    
    if (!signature) {
      console.error('❌ Cashfree webhook signature missing in headers');
      return false;
    }

    if (!webhookSecret) {
      console.error('❌ CASHFREE_WEBHOOK_SECRET not configured - cannot verify webhook');
      return false;
    }

    // Cashfree webhook signature verification
    // Signature is HMAC SHA256 of raw payload string using WEBHOOK_SECRET
    // Payload must be raw string (not parsed JSON)
    const payloadString = rawPayload instanceof Buffer 
      ? rawPayload.toString('utf8') 
      : typeof rawPayload === 'string' 
        ? rawPayload 
        : JSON.stringify(rawPayload);
    
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payloadString)
      .digest('hex');

    const isValid = expectedSignature === signature;
    
    if (!isValid) {
      console.error('❌ Cashfree webhook signature verification failed');
      console.error('   Received signature prefix:', signature.substring(0, 20) + '...');
      console.error('   Expected signature prefix:', expectedSignature.substring(0, 20) + '...');
      console.error('   Payload length:', payloadString.length);
    } else {
      console.log('✅ Cashfree webhook signature verified');
    }

    return isValid;
  } catch (error) {
    console.error('❌ Cashfree webhook signature verification error:', error.message);
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
 * Get payment link for Cashfree checkout (PROD)
 * @param {string} paymentSessionId - Payment session ID
 * @returns {string} Payment checkout URL
 */
export const getCashfreeCheckoutUrl = (paymentSessionId) => {
  // Cashfree PROD checkout uses Checkout JS SDK (drop-in)
  // Frontend will use payment_session_id with Cashfree Checkout JS
  return `https://www.cashfree.com/checkout/post/submit?session_id=${paymentSessionId}`;
};

export default {
  createPaymentSession: createCashfreePaymentSession,
  verifyWebhookSignature: verifyCashfreeWebhookSignature,
  fetchPaymentStatus: fetchCashfreePaymentStatus,
  getCheckoutUrl: getCashfreeCheckoutUrl,
};

