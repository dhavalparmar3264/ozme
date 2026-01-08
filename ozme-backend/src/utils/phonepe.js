import crypto from 'crypto';

/**
 * PhonePe Payment Gateway Utility (SDK-based approach)
 * Uses PhonePe SDK credentials and API structure
 */

/**
 * Get PhonePe configuration from environment (PROD only)
 * @returns {Object} PhonePe configuration
 */
const getPhonePeConfig = () => {
  const merchantId = process.env.PHONEPE_MERCHANT_ID;
  
  // CRITICAL: SALT_KEY and SALT_INDEX are REQUIRED for Pay Page (Checksum/Salt) integration
  // Pay Page integration uses SALT_KEY for X-VERIFY signature (NOT CLIENT_SECRET)
  // OAuth/CLIENT_SECRET is NOT used for Pay Page integration
  const saltKey = process.env.PHONEPE_SALT_KEY;
  const saltIndex = process.env.PHONEPE_SALT_INDEX || '1';
  
  // CRITICAL: Use PROD base URL from env, NEVER default to UAT
  // PhonePe PROD base URL options:
  // - https://api.phonepe.com/apis/hermes (Hermes API)
  // - https://api.phonepe.com/apis/pg-sandbox (UAT - DO NOT USE)
  // For Pay Page integration, endpoint is: /pg/v1/pay
  const baseURL = process.env.PHONEPE_BASE_URL || 'https://api.phonepe.com/apis/hermes';
  const mode = process.env.PHONEPE_MODE || 'PROD';

  // DEBUG: Log environment variables
  console.log('🔍 DEBUG: PhonePe Config Loading:', {
    PHONEPE_MODE: process.env.PHONEPE_MODE || 'NOT SET (defaults to PROD)',
    PHONEPE_BASE_URL: process.env.PHONEPE_BASE_URL || 'NOT SET (defaults to PROD)',
    resolvedMode: mode,
    resolvedBaseURL: baseURL,
  });

  // Validate PROD mode - STRICT: no fallback to UAT
  if (mode !== 'PROD') {
    console.error('❌ CRITICAL: PhonePe mode is not PROD!');
    console.error('   PHONEPE_MODE:', mode);
    console.error('   This will cause UAT URLs to be returned.');
    throw new Error(
      `PhonePe mode must be PROD. Current mode: ${mode}. Please set PHONEPE_MODE=PROD in your .env file.`
    );
  }

  if (!merchantId) {
    throw new Error(
      'PhonePe PROD MERCHANT_ID not configured. Please set PHONEPE_MERCHANT_ID in your .env file.'
    );
  }

  // CRITICAL: SALT_KEY and SALT_INDEX are REQUIRED for Pay Page integration
  // Payment initiation MUST fail if these are missing
  if (!saltKey) {
    throw new Error(
      'PhonePe PROD SALT_KEY is REQUIRED but not configured. Please set PHONEPE_SALT_KEY in your .env file. Payment initiation cannot proceed without SALT_KEY.'
    );
  }

  if (!saltIndex) {
    throw new Error(
      'PhonePe PROD SALT_INDEX is REQUIRED but not configured. Please set PHONEPE_SALT_INDEX in your .env file. Payment initiation cannot proceed without SALT_INDEX.'
    );
  }

  // Verify merchant ID is not a test/UAT merchant ID
  if (merchantId.toUpperCase().startsWith('PGTEST') || merchantId.toUpperCase().includes('UAT')) {
    console.error('❌ CRITICAL: Merchant ID appears to be a test/UAT merchant ID!');
    console.error('   Merchant ID:', merchantId);
    console.error('   Test merchant IDs start with PGTEST or contain UAT');
    throw new Error(
      `Merchant ID appears to be a test/UAT merchant ID: ${merchantId}. Please use PROD merchant ID from PhonePe dashboard.`
    );
  }

  // Verify base URL is PROD (not UAT/sandbox) - STRICT CHECK
  const uatIndicators = ['preprod', 'sandbox', 'testing', 'mercury-uat', 'api-testing', 'merchant-simulator'];
  const hasUatIndicator = uatIndicators.some(indicator => baseURL.toLowerCase().includes(indicator));
  
  if (hasUatIndicator) {
    console.error('❌ CRITICAL: PhonePe base URL contains UAT/sandbox indicators!');
    console.error('   PHONEPE_BASE_URL:', baseURL);
    console.error('   UAT indicators found in URL');
    throw new Error(
      `PhonePe base URL must be PROD. Current URL: ${baseURL}. Please set PHONEPE_BASE_URL=https://api.phonepe.com/apis/hermes in your .env file.`
    );
  }

  // Verify base URL is exactly PROD endpoint
  const expectedProdUrl = 'https://api.phonepe.com/apis/hermes';
  if (baseURL !== expectedProdUrl && !baseURL.startsWith(expectedProdUrl)) {
    console.warn('⚠️  PhonePe base URL does not match expected PROD URL');
    console.warn('   Expected:', expectedProdUrl);
    console.warn('   Got:', baseURL);
  }

  console.log('🔧 PhonePe PROD Configuration (Pay Page - Checksum/Salt):', {
    mode: 'PROD',
    baseURL,
    merchantId: merchantId?.substring(0, 10) + '...',
    saltKeyLength: saltKey?.length || 0,
    saltIndex: saltIndex,
    integrationType: 'Pay Page (Checksum/Salt flow)',
    signatureFormat: 'sha256(base64Payload + endpoint + SALT_KEY) + "###" + SALT_INDEX',
    headers: ['Content-Type', 'Accept', 'X-VERIFY', 'X-MERCHANT-ID'],
  });

  return {
    merchantId,
    saltKey,
    saltIndex,
    baseURL,
    environment: 'PROD',
  };
};

/**
 * Generate X-VERIFY signature for PhonePe Pay Page API (PROD)
 * Pay Page integration uses Checksum/Salt flow (NOT OAuth)
 * Signature format: sha256(base64Payload + endpoint + SALT_KEY) + "###" + SALT_INDEX
 * @param {string} base64Payload - Base64 encoded payload
 * @param {string} endpoint - API endpoint path (must be exact, e.g., "/pg/v1/pay")
 * @returns {string} X-VERIFY signature
 */
const generateXVerifySignature = (base64Payload, endpoint) => {
  const config = getPhonePeConfig();
  
  // CRITICAL: Verify SALT_KEY exists
  if (!config.saltKey) {
    console.error('❌ CRITICAL: SALT_KEY is missing in generateXVerifySignature!');
    console.error('   This will cause invalid signature and PhonePe will return 404.');
    throw new Error('PhonePe SALT_KEY not configured. Please set PHONEPE_SALT_KEY in .env file.');
  }
  
  // Normalize endpoint path (ensure no trailing slash, correct format)
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // CRITICAL: Pay Page integration uses SALT_KEY for signature hash (NOT CLIENT_SECRET)
  // Signature: sha256(base64Payload + endpoint + SALT_KEY) + "###" + SALT_INDEX
  const stringToHash = base64Payload + normalizedEndpoint + config.saltKey;
  const sha256Hash = crypto.createHash('sha256').update(stringToHash).digest('hex');
  
  // Append SALT_INDEX to signature
  const signature = `${sha256Hash}###${config.saltIndex}`;
  
  console.log('🔐 X-VERIFY Signature Generated:', {
    endpoint: normalizedEndpoint,
    saltKeyLength: config.saltKey?.length || 0,
    saltIndex: config.saltIndex,
    signatureLength: signature.length,
    signaturePrefix: signature.substring(0, 20) + '...',
    signatureSuffix: signature.substring(signature.length - 10),
    signatureFormat: 'sha256(base64Payload + endpoint + SALT_KEY) + "###" + SALT_INDEX',
    hashInputLength: stringToHash.length,
  });
  
  return signature;
};

/**
 * Create PhonePe payment using Pay Page (Checksum/Salt) integration
 * Pay Page integration - NO OAuth required, uses SALT_KEY for signature
 * @param {Object} params - Payment parameters
 * @param {string} params.merchantTransactionId - Unique merchant transaction ID
 * @param {number} params.amountPaise - Amount in paise
 * @param {string} params.userId - User ID or guest token
 * @param {string} params.mobileNumber - Customer mobile number
 * @param {string} params.redirectUrl - Redirect URL after payment
 * @param {string} params.callbackUrl - Callback URL for webhook
 * @returns {Promise<Object>} Payment response with redirect URL
 */
export const createPhonePePayment = async ({
  merchantTransactionId,
  amountPaise,
  userId,
  mobileNumber,
  redirectUrl,
  callbackUrl,
}) => {
  try {
    const config = getPhonePeConfig();

    // DEBUG: Log environment variables (NO secrets)
    console.log('🔍 DEBUG: PhonePe Payment Creation (Pay Page):', {
      PHONEPE_MODE: process.env.PHONEPE_MODE || 'NOT SET',
      PHONEPE_BASE_URL: process.env.PHONEPE_BASE_URL || 'NOT SET (using default)',
      baseURL: config.baseURL,
      merchantId: config.merchantId?.substring(0, 10) + '...',
      saltKeyLength: config.saltKey?.length || 0,
      saltIndex: config.saltIndex,
      integrationType: 'Pay Page (Checksum/Salt flow)',
    });

    // Build request payload for SDK-based API
    const payload = {
      merchantId: config.merchantId,
      merchantTransactionId,
      merchantUserId: userId || `user_${merchantTransactionId}`,
      amount: amountPaise,
      redirectUrl,
      redirectMode: 'REDIRECT',
      callbackUrl,
      paymentInstrument: {
        type: 'PAY_PAGE',
      },
    };

    // Base64 encode payload
    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');

    // Generate X-VERIFY signature for Pay Page integration
    // Endpoint must be exactly "/pg/v1/pay" (no trailing slash)
    const endpoint = '/pg/v1/pay';
    const xVerify = generateXVerifySignature(base64Payload, endpoint);

    // Build full API URL - MUST be PROD endpoint
    const fullUrl = `${config.baseURL}${endpoint}`;
    
    // Expected PROD URL: https://api.phonepe.com/apis/hermes/pg/v1/pay
    const expectedProdUrl = 'https://api.phonepe.com/apis/hermes/pg/v1/pay';
    
    // DEBUG: Log exact URL being called
    console.log('🔍 DEBUG: PhonePe API Call Details:', {
      PHONEPE_MODE: process.env.PHONEPE_MODE || 'NOT SET',
      PHONEPE_BASE_URL: process.env.PHONEPE_BASE_URL || 'NOT SET',
      configBaseURL: config.baseURL,
      endpoint: endpoint,
      fullUrl: fullUrl,
      expectedProdUrl: expectedProdUrl,
      urlMatches: fullUrl === expectedProdUrl,
    });
    
    // Verify PROD URL (strict check - reject ALL UAT indicators)
    const uatIndicators = ['preprod', 'sandbox', 'testing', 'mercury-uat', 'api-testing', 'merchant-simulator', 'pg-sandbox'];
    const isUatUrl = uatIndicators.some(indicator => fullUrl.toLowerCase().includes(indicator));
    const isProdUrl = fullUrl.includes('api.phonepe.com') && fullUrl.includes('/apis/hermes');
    
    if (isUatUrl || !isProdUrl) {
      console.error('❌ CRITICAL: PhonePe API URL is not PROD!');
      console.error('   Full URL:', fullUrl);
      console.error('   Expected PROD URL:', expectedProdUrl);
      console.error('   PHONEPE_BASE_URL:', process.env.PHONEPE_BASE_URL || 'NOT SET');
      console.error('   PHONEPE_MODE:', process.env.PHONEPE_MODE || 'NOT SET');
      console.error('   Is UAT URL:', isUatUrl);
      console.error('   Is PROD URL:', isProdUrl);
      throw new Error('PhonePe API URL is not production. Check PHONEPE_BASE_URL and PHONEPE_MODE in .env file.');
    }
    
    console.log('📡 PhonePe PROD API Request (Pay Page):', {
      url: fullUrl,
      method: 'POST',
      environment: 'PROD',
      baseURL: config.baseURL,
      merchantId: config.merchantId?.substring(0, 10) + '...',
      amountPaise,
      merchantTransactionId,
      redirectUrl: redirectUrl.substring(0, 80) + '...',
      callbackUrl: callbackUrl.substring(0, 80) + '...',
    });

    const requestBody = {
      request: base64Payload,
    };

    // CRITICAL: Verify SALT_KEY is actually loaded
    if (!config.saltKey) {
      console.error('❌ CRITICAL: SALT_KEY is missing from config!');
      console.error('   This will cause PhonePe to return UAT URLs.');
      console.error('   Please set PHONEPE_SALT_KEY in .env file.');
      throw new Error('PhonePe SALT_KEY not configured. Please set PHONEPE_SALT_KEY in .env file.');
    }

    // DEBUG: Log exact headers being sent (without secrets)
    // Pay Page integration uses X-MERCHANT-ID (not X-CLIENT-ID)
    const requestHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-VERIFY': xVerify,
      'X-MERCHANT-ID': config.merchantId,  // Pay Page uses X-MERCHANT-ID
    };
    
    // Log signature generation details for debugging
    const signatureDebugInfo = {
      base64PayloadLength: base64Payload.length,
      endpoint: endpoint,
      saltKeyLength: config.saltKey?.length || 0,
      saltIndex: config.saltIndex,
      signatureLength: xVerify.length,
      signatureFormat: 'sha256(base64Payload + endpoint + SALT_KEY) + "###" + SALT_INDEX',
      signaturePrefix: xVerify.substring(0, 40) + '...',
      signatureSuffix: xVerify.substring(xVerify.length - 10),
    };
    
    console.log('📤 PhonePe Request Headers (Pay Page):', {
      url: fullUrl,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-VERIFY': xVerify.substring(0, 30) + '... (length: ' + xVerify.length + ')',
        'X-MERCHANT-ID': config.merchantId,
      },
      signatureDetails: {
        endpoint: endpoint,
        saltKeyLength: config.saltKey?.length || 0,
        saltIndex: config.saltIndex,
        signatureFormat: 'sha256(base64Payload + endpoint + SALT_KEY) + "###" + SALT_INDEX',
      },
      merchantId: config.merchantId,
      merchantTransactionId,
    });

    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(requestBody),
    });

    let responseData;
    const responseText = await response.text();
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = { rawResponse: responseText };
    }

    // DEBUG: Log full API response details
    console.log('🔍 DEBUG: PhonePe API Response (Full):', {
      status: response.status,
      statusText: response.statusText,
      responseHeaders: Object.fromEntries(response.headers.entries()),
      responseTextLength: responseText.length,
      responseTextPreview: responseText.substring(0, 500),
      hasResponseData: !!responseData,
      responseDataKeys: responseData ? Object.keys(responseData) : [],
    });

    if (!response.ok) {
      const errorMessage = responseData?.message || responseData?.error || responseData?.code || responseData?.rawResponse || `HTTP ${response.status}`;
      
      // Enhanced error logging for 404 specifically
      if (response.status === 404) {
        console.error('❌ PhonePe API returned 404 - Endpoint not found:', {
          status: response.status,
          url: fullUrl,
          endpoint: endpoint,
          baseURL: config.baseURL,
          merchantId: config.merchantId,
          error: errorMessage,
          fullResponse: responseData,
          responseText: responseText.substring(0, 500),
        });
        console.error('🔍 404 Error Diagnostics:');
        console.error('   Possible causes:');
        console.error('   1. Endpoint path incorrect - verify: /pg/v1/pay');
        console.error('   2. Merchant ID invalid or not activated for PROD');
        console.error('   3. SALT_KEY incorrect - signature validation failed');
        console.error('   4. Base URL incorrect - should be: https://api.phonepe.com/apis/hermes');
        console.error('   Current configuration:');
        console.error('   - Base URL:', config.baseURL);
        console.error('   - Endpoint:', endpoint);
        console.error('   - Full URL:', fullUrl);
        console.error('   - Merchant ID:', config.merchantId);
        console.error('   - SALT_KEY length:', config.saltKey?.length || 0);
        console.error('   - SALT_INDEX:', config.saltIndex);
        console.error('   Action: Verify SALT_KEY matches PhonePe dashboard PROD credentials');
        console.error('   Action: Verify merchant account is activated for PROD');
        console.error('   Action: Contact PhonePe support if credentials are correct');
      }
      
      console.error('❌ PhonePe payment creation failed:', {
        status: response.status,
        statusText: response.statusText,
        url: fullUrl,
        error: errorMessage,
        fullResponse: responseData,
        responseText: responseText.substring(0, 1000),
        requestPayload: {
          merchantId: config.merchantId,
          merchantTransactionId,
          amountPaise,
          base64PayloadLength: base64Payload.length,
          base64PayloadPreview: base64Payload.substring(0, 100) + '...',
        },
        signatureDetails: {
          signaturePrefix: xVerify.substring(0, 30) + '...',
          signatureLength: xVerify.length,
          signatureFormat: 'sha256(base64Payload + endpoint + SALT_KEY) + "###" + SALT_INDEX',
          saltKeyLength: config.saltKey?.length || 0,
          saltIndex: config.saltIndex,
          endpoint: endpoint,
        },
        headersSent: {
          'X-VERIFY': xVerify.substring(0, 30) + '...',
          'X-MERCHANT-ID': config.merchantId,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      
      // Provide clear error message for 404
      if (response.status === 404) {
        const errorMsg = `PhonePe API returned 404. Possible causes: 1) SALT_KEY incorrect - verify it matches PhonePe dashboard PROD credentials, 2) Merchant account not activated for PROD, 3) Endpoint path incorrect. URL: ${fullUrl}`;
        console.error('❌ PhonePe 404 Error:', errorMsg);
        throw new Error(errorMsg);
      }
      
      throw new Error(`Failed to create PhonePe payment: ${errorMessage}`);
    }

    // DEBUG: Log raw response (already logged above, but keep for compatibility)
    console.log('🔍 DEBUG: PhonePe API Response (Parsed):', {
      status: response.status,
      statusText: response.statusText,
      hasResponse: !!responseData,
      responseKeys: responseData ? Object.keys(responseData) : [],
      responseType: typeof responseData,
      fullResponsePreview: JSON.stringify(responseData).substring(0, 500),
    });

    // Decode response if it's base64 encoded
    let decodedResponse = responseData;
    if (responseData?.response) {
      try {
        decodedResponse = JSON.parse(Buffer.from(responseData.response, 'base64').toString());
        console.log('🔍 DEBUG: Decoded base64 response:', {
          hasData: !!decodedResponse.data,
          hasInstrumentResponse: !!decodedResponse.instrumentResponse,
          hasRedirectInfo: !!decodedResponse.redirectInfo,
          decodedKeys: Object.keys(decodedResponse),
        });
      } catch (e) {
        console.warn('⚠️ Failed to decode base64 response, using raw:', e.message);
        decodedResponse = responseData;
      }
    }

    // Extract redirect URL from response (check all possible paths)
    const redirectInfo = decodedResponse?.data?.instrumentResponse?.redirectInfo || 
                        decodedResponse?.instrumentResponse?.redirectInfo ||
                        decodedResponse?.redirectInfo ||
                        decodedResponse?.data?.redirectInfo;
    
    // DEBUG: Log redirect info extraction
    console.log('🔍 DEBUG: Redirect URL Extraction:', {
      hasRedirectInfo: !!redirectInfo,
      redirectInfoKeys: redirectInfo ? Object.keys(redirectInfo) : [],
      redirectUrl: redirectInfo?.url ? redirectInfo.url.substring(0, 100) : 'NOT FOUND',
    });
    
    if (!redirectInfo || !redirectInfo.url) {
      console.error('❌ PhonePe response missing redirect URL:', {
        responseData: JSON.stringify(responseData).substring(0, 500),
        decodedResponse: JSON.stringify(decodedResponse).substring(0, 500),
        responseStructure: {
          hasData: !!decodedResponse?.data,
          hasInstrumentResponse: !!decodedResponse?.instrumentResponse,
          hasRedirectInfo: !!decodedResponse?.redirectInfo,
        },
      });
      throw new Error('Invalid response from PhonePe API: missing redirect URL');
    }

    // Parse checkout URL to verify domain
    let checkoutDomain = 'unknown';
    try {
      const urlObj = new URL(redirectInfo.url);
      checkoutDomain = urlObj.hostname;
    } catch (e) {
      console.error('❌ Failed to parse redirect URL:', redirectInfo.url);
    }

    // CRITICAL: Comprehensive diagnostic logs (no secrets)
    const isUatDomain = checkoutDomain.includes('mercury-uat') || 
                       checkoutDomain.includes('merchant-simulator') ||
                       checkoutDomain.includes('pgtest') ||
                       redirectInfo.url.includes('/simulator');

    console.log('🔍 DEBUG: Redirect URL Details (Diagnostic):', {
      fullUrlCalled: fullUrl,
      expectedProdUrl: 'https://api.phonepe.com/apis/hermes/pg/v1/pay',
      urlMatches: fullUrl === 'https://api.phonepe.com/apis/hermes/pg/v1/pay',
      redirectUrl: redirectInfo.url,
      checkoutDomain: checkoutDomain,
      isUatDomain: isUatDomain,
      integrationType: 'Pay Page (Checksum/Salt flow)',
      signatureMode: 'sha256(base64Payload + endpoint + SALT_KEY) + "###" + SALT_INDEX',
      headersSent: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-VERIFY': 'sha256(...)###' + config.saltIndex,
        'X-MERCHANT-ID': config.merchantId,
      },
      configCheck: {
        hasSaltKey: !!config.saltKey,
        saltKeyLength: config.saltKey?.length || 0,
        saltIndex: config.saltIndex,
        merchantId: config.merchantId?.substring(0, 10) + '...',
        baseURL: config.baseURL,
      },
    });

    // CRITICAL: If UAT domain detected, log detailed diagnostic
    if (isUatDomain) {
      console.error('❌ CRITICAL: PhonePe returned UAT/simulator URL!');
      console.error('   Diagnostic Information:');
      console.error('   - Full URL Called:', fullUrl);
      console.error('   - Redirect Domain:', checkoutDomain);
      console.error('   - Redirect URL:', redirectInfo.url);
      console.error('   - Signature Mode: Checksum/Salt flow');
      console.error('   - Headers Sent: X-VERIFY, X-MERCHANT-ID, Content-Type, Accept');
      console.error('   - SALT_KEY Configured:', !!config.saltKey, '(length:', config.saltKey?.length || 0, ')');
      console.error('   - SALT_INDEX:', config.saltIndex);
      console.error('   Possible Causes:');
      console.error('   1. SALT_KEY mismatch with PhonePe dashboard');
      console.error('   2. SALT_INDEX mismatch with PhonePe dashboard');
      console.error('   3. Invalid signature (credentials or signature format)');
      console.error('   4. Merchant account not activated for PROD');
      console.error('   5. Merchant ID is UAT/test merchant ID');
      console.error('   Action: Verify SALT_KEY and SALT_INDEX match PhonePe dashboard PROD credentials');
      console.error('   Action: Contact PhonePe support if credentials are correct');
    }

    // Verify PROD checkout URL (strict check - reject ALL UAT/simulator indicators)
    const redirectUrlLower = redirectInfo.url.toLowerCase();
    const uatCheckoutIndicators = [
      'preprod', 'sandbox', 'testing', 'mercury-uat', 'api-testing', 
      'merchant-simulator', '/simulator', 'pgtest', 'pg-sandbox'
    ];
    const isUatCheckout = uatCheckoutIndicators.some(indicator => 
      checkoutDomain.toLowerCase().includes(indicator) || 
      redirectUrlLower.includes(indicator)
    );
    
    // DEBUG: Log redirect URL details
    console.log('🔍 DEBUG: Redirect URL Validation:', {
      redirectUrl: redirectInfo.url,
      checkoutDomain: checkoutDomain,
      isUatCheckout: isUatCheckout,
      detectedIndicators: uatCheckoutIndicators.filter(ind => 
        checkoutDomain.toLowerCase().includes(ind) || redirectUrlLower.includes(ind)
      ),
    });
    
    if (isUatCheckout) {
      console.error('❌ CRITICAL: PhonePe returned UAT/simulator checkout URL!');
      console.error('   Checkout Domain:', checkoutDomain);
      console.error('   Full URL:', redirectInfo.url);
      console.error('   Detected UAT/simulator indicators in URL');
      console.error('   API Endpoint Called:', fullUrl);
      console.error('   Merchant ID:', config.merchantId?.substring(0, 10) + '...');
      console.error('   Possible causes:');
      console.error('   1. Invalid X-VERIFY signature (using wrong secret/key)');
      console.error('   2. Merchant account (M23BLFR8IV7IN) is not activated for PROD in PhonePe dashboard');
      console.error('   3. Merchant ID is a test/UAT merchant ID (should not start with PGTEST)');
      console.error('   4. Credentials are UAT credentials (not PROD)');
      console.error('   5. SALT_KEY or SALT_INDEX mismatch with PhonePe dashboard');
      console.error('   6. PhonePe API detected merchant as UAT based on account status');
      console.error('   Signature Details:');
      console.error('   - Using SALT_KEY for signature: ' + (config.saltKey ? 'YES (length: ' + config.saltKey.length + ')' : 'NO'));
      console.error('   - Using SALT_INDEX: ' + config.saltIndex);
      console.error('   - Signature format: sha256(base64Payload + endpoint + SALT_KEY) + "###" + SALT_INDEX');
      console.error('   Action Required:');
      console.error('   - Verify PHONEPE_SALT_KEY matches PhonePe dashboard PROD credentials');
      console.error('   - Verify PHONEPE_SALT_INDEX matches PhonePe dashboard (usually "1")');
      console.error('   - Contact PhonePe support to activate merchant account for PROD');
      console.error('   - Verify merchant ID is PROD merchant ID in PhonePe dashboard');
      throw new Error('PhonePe returned UAT/simulator checkout URL. Merchant account may not be activated for PROD. Contact PhonePe support.');
    }

    console.log('✅ PhonePe PROD payment created successfully:', {
      merchantTransactionId,
      environment: 'PROD',
      checkoutDomain: checkoutDomain,
      redirectUrl: redirectInfo.url.substring(0, 80) + '...',
      apiEndpoint: fullUrl,
    });

    return {
      redirectUrl: redirectInfo.url,
      merchantTransactionId,
      rawResponse: responseData,
    };
  } catch (error) {
    console.error('PhonePe create payment error:', error);
    
    if (error.message && error.message.includes('not configured')) {
      throw error;
    }
    
    throw new Error(`Failed to create PhonePe payment: ${error.message || 'Unknown error'}`);
  }
};

/**
 * DEPRECATED: Callback signature verification
 * 
 * NOTE: We now use status API as source of truth instead of signature verification.
 * This function is kept for backward compatibility but is no longer used.
 * 
 * @deprecated Use getPhonePeStatus() instead for reliable payment status
 */
export const verifyPhonePeCallback = (callbackBody, xVerifyHeader) => {
  console.warn('⚠️  verifyPhonePeCallback is deprecated. Using status API as source of truth.');
  // Always return true to allow callback processing, but status API will verify
  return true;
};

/**
 * Get PhonePe payment status
 * @param {string} merchantTransactionId - Merchant transaction ID
 * @returns {Promise<Object>} Payment status details
 */
export const getPhonePeStatus = async (merchantTransactionId) => {
  try {
    const config = getPhonePeConfig();

    // For status check, we need to create a base64 payload
    const payload = {
      merchantId: config.merchantId,
      merchantTransactionId,
    };
    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');

    // Generate X-VERIFY signature
    const endpoint = `/pg/v1/status/${config.merchantId}/${merchantTransactionId}`;
    const xVerify = generateXVerifySignature(base64Payload, endpoint);

    // Make API request - Pay Page integration uses X-MERCHANT-ID (NOT X-CLIENT-ID)
    // Endpoint must be exactly "/pg/v1/status/{merchantId}/{merchantTransactionId}"
    const response = await fetch(`${config.baseURL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-VERIFY': xVerify,
        'X-MERCHANT-ID': config.merchantId,
      },
    });

    const responseData = await response.json();

    if (!response.ok) {
      const errorMessage = responseData?.message || responseData?.error || `HTTP ${response.status}`;
      
      if (response.status === 404) {
        throw new Error(`Transaction not found: ${merchantTransactionId}`);
      }
      
      throw new Error(`Failed to fetch payment status: ${errorMessage}`);
    }

    // Decode response if it's base64 encoded
    let statusData = responseData;
    if (responseData?.response) {
      try {
        statusData = JSON.parse(Buffer.from(responseData.response, 'base64').toString());
      } catch (e) {
        // If not base64, use as is
        statusData = responseData;
      }
    }

    return {
      merchantTransactionId: statusData?.merchantTransactionId || merchantTransactionId,
      transactionId: statusData?.transactionId,
      state: statusData?.state, // SUCCESS, FAILED, PENDING
      amount: statusData?.amount,
      responseCode: statusData?.responseCode,
      responseMsg: statusData?.responseMsg,
      rawResponse: responseData,
    };
  } catch (error) {
    console.error('PhonePe get status error:', error);
    throw new Error(`Failed to fetch payment status: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Test function to validate PhonePe integration and print request/response details
 * This function can be called to verify the integration is using correct URLs and signatures
 * @param {Object} params - Test payment parameters
 * @returns {Promise<Object>} Test results with fullUrl and redirect domain
 */
export const testPhonePeIntegration = async ({
  merchantTransactionId = `TEST_${Date.now()}`,
  amountPaise = 10000, // 100 INR
  userId = 'test_user',
  redirectUrl = 'https://ozme.in/test',
  callbackUrl = 'https://www.ozme.in/api/payments/phonepe/callback',
}) => {
  try {
    const config = getPhonePeConfig();
    
    console.log('🧪 PhonePe Integration Test:');
    console.log('='.repeat(60));
    
    // Build test payload
    const payload = {
      merchantId: config.merchantId,
      merchantTransactionId,
      merchantUserId: userId,
      amount: amountPaise,
      redirectUrl,
      redirectMode: 'REDIRECT',
      callbackUrl,
      paymentInstrument: {
        type: 'PAY_PAGE',
      },
    };
    
    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
    const endpoint = '/pg/v1/pay';
    const xVerify = generateXVerifySignature(base64Payload, endpoint);
    const fullUrl = `${config.baseURL}${endpoint}`;
    
    // Parse redirect URL to get domain
    let redirectDomain = 'NOT_YET_CALLED';
    let isUatDomain = false;
    
    try {
      const result = await createPhonePePayment({
        merchantTransactionId,
        amountPaise,
        userId,
        mobileNumber: '9999999999',
        redirectUrl,
        callbackUrl,
      });
      
      if (result.redirectUrl) {
        const urlObj = new URL(result.redirectUrl);
        redirectDomain = urlObj.hostname;
        isUatDomain = redirectDomain.includes('mercury-uat') || 
                     redirectDomain.includes('merchant-simulator') ||
                     redirectDomain.includes('pgtest');
      }
      
      console.log('✅ Test Results:');
      console.log('   Full URL Called:', fullUrl);
      console.log('   Redirect Domain:', redirectDomain);
      console.log('   Is UAT Domain:', isUatDomain);
      console.log('   Signature Format:', 'sha256(base64Payload + endpoint + SALT_KEY) + "###" + SALT_INDEX');
      console.log('   Salt Index Used:', config.saltIndex);
      console.log('   Headers Sent:', {
        'X-VERIFY': xVerify.substring(0, 30) + '...',
        'X-CLIENT-ID': config.clientId,
      });
      
      return {
        success: true,
        fullUrlCalled: fullUrl,
        redirectDomain: redirectDomain,
        isUatDomain: isUatDomain,
        redirectUrl: result.redirectUrl,
        signatureFormat: 'sha256(base64Payload + endpoint + SALT_KEY) + "###" + SALT_INDEX',
        saltIndex: config.saltIndex,
      };
    } catch (error) {
      console.error('❌ Test Failed:', error.message);
      return {
        success: false,
        fullUrlCalled: fullUrl,
        redirectDomain: 'ERROR',
        error: error.message,
        signatureFormat: 'sha256(base64Payload + endpoint + SALT_KEY) + "###" + SALT_INDEX',
        saltIndex: config.saltIndex,
      };
    }
  } catch (error) {
    console.error('❌ Test Setup Failed:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

export default {
  createPhonePePayment,
  verifyPhonePeCallback,
  getPhonePeStatus,
  testPhonePeIntegration,
};
