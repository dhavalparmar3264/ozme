# Order Confirmation Email Implementation

## Overview
Automated order confirmation emails are sent to customers whenever an order is successfully placed (COD or Online Payment).

## Implementation Details

### Email Template
- **Subject:** `🎉 Order Confirmed! – OZME Perfumes`
- **Sender:** `Ozme Orders <ozme.orders@outlook.com>` (configurable via `MAIL_USERNAME` env var)
- **BCC:** `ozme.orders@outlook.com` (for admin record keeping)

### Email Content
The email includes:
1. **Header:** Dark background with "Order Confirmed!" message
2. **Greeting:** Personalized with customer's full name (uppercase)
3. **Order Details:**
   - Order ID (highlighted in gold)
   - Order Date
   - Payment Method (COD or Online Payment)
4. **Items Table:**
   - Product name (with "OZME" highlighted in gold)
   - Quantity
   - Price per item
   - Total amount
5. **Shipping Address:**
   - Full address details
   - Phone number
6. **Tracking Message:** Order ID for tracking
7. **Footer:** Brand name and copyright

### Email Trigger Points

#### 1. COD Orders
**Location:** `ozme-backend/src/controllers/orderController.js` (line ~382)
- Triggered immediately after order creation
- Email sent synchronously but non-blocking (order succeeds even if email fails)

```javascript
if (paymentMethod === 'COD' || (!paymentMethod || paymentMethod.toUpperCase() === 'COD')) {
  try {
    await sendOrderConfirmationEmail(order, order.user);
  } catch (emailError) {
    // Don't fail the order if email fails
  }
}
```

#### 2. Online Payment (Razorpay)
**Location:** `ozme-backend/src/controllers/paymentController.js` (line ~170)
- Triggered after payment verification succeeds
- Email sent after order status updated to "Processing"
- **⚠️ Note:** Currently missing idempotency check - may send duplicate emails if endpoint called multiple times

```javascript
// ⚠️ RECOMMENDED: Add idempotency check before processing
if (order.paymentStatus === 'Paid') {
  return res.status(200).json({
    success: true,
    message: 'Payment already verified'
  });
}

order.paymentStatus = 'Paid';
order.orderStatus = 'Processing';
await order.save();

try {
  await sendOrderConfirmationEmail(order, order.user);
} catch (emailError) {
  // Don't fail payment verification if email fails
}
```

#### 3. Cashfree Webhook
**Location:** `ozme-backend/src/controllers/paymentController.js` (line ~767)
- Triggered when Cashfree sends payment success webhook
- Email sent after order status updated
- **✅ Idempotency:** Includes check at line 677 to prevent duplicate processing
- **⚠️ Note:** Webhook retries may still send duplicate emails if idempotency check passes before order save

```javascript
// Idempotency check (line 677)
if (order.paymentStatus === 'Paid' && order.orderStatus !== 'Pending') {
  return res.status(200).json({ success: true, message: 'Already processed' });
}

order.paymentStatus = 'Paid';
order.orderStatus = 'Processing';
await order.save();

try {
  await sendOrderConfirmationEmail(order, order.user);
} catch (emailError) {
  // Non-blocking
}
```

#### 4. PhonePe Callback
**Location:** `ozme-backend/src/controllers/paymentController.js` (line ~1329)
- Triggered when PhonePe sends payment success callback
- Email sent after order status updated
- **✅ Idempotency:** Includes check at line 1261 to prevent duplicate processing

```javascript
// Idempotency check (line 1261)
if (order.paymentStatus === 'Paid' && order.orderStatus !== 'Pending') {
  return res.status(200).json({ success: true, message: 'Already processed' });
}

order.paymentStatus = 'Paid';
order.orderStatus = 'Processing';
await order.save();

try {
  await sendOrderConfirmationEmail(order, order.user);
} catch (emailError) {
  // Non-blocking
}
```

#### 5. PhonePe Verify Payment
**Location:** `ozme-backend/src/controllers/paymentController.js` (line ~1511)
- Triggered when manually verifying PhonePe payment
- Email sent after order status updated

### Files Modified

1. **`ozme-backend/src/utils/orderEmails.js`**
   - Updated `sendOrderConfirmationEmail()` function
   - New professional HTML template matching design requirements
   - Subject line: `🎉 Order Confirmed! – OZME Perfumes`
   - Custom sender: `Ozme Orders <ozme.orders@outlook.com>`
   - BCC support for admin copy

2. **`ozme-backend/src/utils/sendEmail.js`**
   - Added `bcc` parameter support
   - Added `from` parameter for custom sender
   - Maintains backward compatibility

### Environment Variables

**Required in `.env`:**
```env
# SMTP Configuration (Office365/Outlook) - REQUIRED
EMAIL_HOST=smtp.office365.com
EMAIL_PORT=587
EMAIL_USER=ozme.orders@outlook.com
EMAIL_PASSWORD=your-app-password
EMAIL_SECURE=false

# Sender Display Name (OPTIONAL - defaults to EMAIL_USER)
EMAIL_FROM=Ozme Orders <ozme.orders@outlook.com>

# Admin BCC Email (OPTIONAL - defaults to EMAIL_USER)
ADMIN_BCC_EMAIL=ozme.orders@outlook.com
```

**Note:** 
- `EMAIL_USER` is the primary variable for SMTP authentication
- `MAIL_USERNAME` is deprecated - use `EMAIL_USER` instead
- `EMAIL_FROM` controls the display name in email clients
- `ADMIN_BCC_EMAIL` can be different from sender email if needed

### Email Features

✅ **Works for ALL orders:**
- COD orders
- Online Payment orders (Razorpay, Cashfree, PhonePe)
- Any price range
- Any product type

✅ **Error Handling:**
- Email failures do NOT break order placement
- Comprehensive error logging
- Graceful fallbacks

✅ **Email Content:**
- Professional HTML design
- Responsive layout
- Brand-consistent styling
- All order details included

✅ **Delivery:**
- Sent to customer email (TO)
- BCC copy to admin (ozme.orders@outlook.com)
- Proper sender identification

### Testing

#### Test COD Order Email:
1. Place a COD order
2. Check customer email inbox
3. Verify email content and formatting
4. Check BCC copy received

#### Test Online Payment Email:
1. Complete an online payment
2. Check customer email inbox after payment success
3. Verify email content
4. Check BCC copy received

#### Verify Email Configuration:
```bash
# Check SMTP connection
curl http://localhost:3002/api/test-email

# Check email logs in server console
# Look for: "✅ Order confirmation email sent successfully"
```

### Troubleshooting

#### Email Not Sending:
1. Check SMTP credentials in `.env`
2. Verify `EMAIL_USER` and `EMAIL_PASSWORD` are correct
3. Check server logs for SMTP errors
4. Ensure Office365 SMTP is enabled for the account

#### Email Formatting Issues:
1. Check HTML template in `orderEmails.js`
2. Verify order data is populated correctly
3. Check browser email client compatibility

#### Missing Customer Email:
- Email will not be sent if customer email is missing
- Check logs: "⚠️ Cannot send order confirmation email - no customer email found"
- Ensure user has email address or shipping address has email
- **Fallback chain:** `user?.email || order.shippingAddress?.email || order.email`

#### Duplicate Emails:
- **Cause:** Webhook retries or missing idempotency checks
- **Check:** Look for multiple "Order confirmation email sent" logs for same order ID
- **Prevention:** 
  - Ensure idempotency checks are in place (Cashfree ✅, PhonePe ✅, Razorpay ⚠️)
  - Consider adding `confirmationEmailSent` flag to Order model
  - Monitor logs for duplicate email sends
- **Current Status:** 
  - Cashfree webhook has idempotency check but may still send duplicates on retries
  - Razorpay verifyPayment missing idempotency check
  - PhonePe callback has idempotency check

### Code Snippets

#### Where Email is Triggered (COD):
```javascript
// ozme-backend/src/controllers/orderController.js
if (paymentMethod === 'COD') {
  try {
    await sendOrderConfirmationEmail(order, order.user);
  } catch (emailError) {
    console.error('Email failed but order succeeded');
  }
}
```

#### Where Email is Triggered (Online Payment):
```javascript
// ozme-backend/src/controllers/paymentController.js
order.paymentStatus = 'Paid';
await order.save();

try {
  await sendOrderConfirmationEmail(order, order.user);
} catch (emailError) {
  console.error('Email failed but payment succeeded');
}
```

### Known Issues & Limitations

1. **Duplicate Email Risk:** 
   - Webhook retries may send duplicate emails
   - Razorpay verifyPayment missing idempotency check
   - **Recommendation:** Add `confirmationEmailSent` flag to Order model

2. **Race Conditions:**
   - Concurrent webhook processing not fully protected
   - **Recommendation:** Use database transactions for critical sections

3. **Missing Validation:**
   - No check if order has items before sending email
   - Unpopulated products show as "Unknown Product"
   - **Recommendation:** Validate order data before email generation

4. **Email Tracking:**
   - No database field to track email delivery status
   - **Recommendation:** Add `confirmationEmailSent`, `confirmationEmailSentAt` fields

### Future Enhancements

1. **Email Queue:** Implement queue system (Bull/BullMQ) for better reliability
2. **Retry Logic:** Automatic retry for failed emails with exponential backoff
3. **Email Templates:** Multiple templates for different order types
4. **Tracking Links:** Direct tracking links in email
5. **Order Updates:** Email notifications for order status changes
6. **Email Monitoring:** Metrics and alerts for email delivery success/failure rates
7. **Idempotency Improvements:** Add email sent flag to prevent all duplicate sends
