import { sendEmail } from './sendEmail.js';

/**
 * Send order confirmation email to customer
 * @param {Object} order - Order object
 * @param {Object} user - User object
 * @returns {Promise<Object>} Email send result
 */
export const sendOrderConfirmationEmail = async (order, user) => {
    const subject = `Order Confirmed - ${order.orderNumber}`;

    const itemsList = order.items
        .map(
            (item) =>
                `<tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.product.name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${(item.price * item.quantity).toLocaleString('en-IN')}</td>
        </tr>`
        )
        .join('');
    
    // Calculate subtotal from items
    const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountAmount = order.discountAmount || 0;
    const shippingCost = 0; // Free shipping
    const finalTotal = order.totalAmount || (subtotal - discountAmount + shippingCost);

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #000 0%, #333 100%); color: white; padding: 30px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .order-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; }
        .total-row { font-weight: bold; font-size: 18px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Order Confirmed!</h1>
          <p>Thank you for shopping with OZME Perfumes</p>
        </div>
        
        <div class="content">
          <p>Hi ${user.name || 'Valued Customer'},</p>
          <p>Your order has been successfully placed and is being processed.</p>
          
          <div class="order-details">
            <h2>Order Details</h2>
            <p><strong>Order ID:</strong> ${order.orderNumber}</p>
            <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p><strong>Payment Method:</strong> ${order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Payment'}</p>
            ${order.promoCode ? `<p><strong>Promo Code:</strong> ${order.promoCode}</p>` : ''}
            
            <h3 style="margin-top: 20px;">Items Ordered</h3>
            <table>
              <thead>
                <tr style="background: #f5f5f5;">
                  <th style="padding: 10px; text-align: left;">Product</th>
                  <th style="padding: 10px; text-align: center;">Qty</th>
                  <th style="padding: 10px; text-align: right;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsList}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="2" style="padding: 10px; text-align: right; border-top: 1px solid #eee;">Subtotal:</td>
                  <td style="padding: 10px; text-align: right; border-top: 1px solid #eee;">₹${subtotal.toLocaleString('en-IN')}</td>
                </tr>
                ${discountAmount > 0 ? `
                <tr>
                  <td colspan="2" style="padding: 10px; text-align: right; color: #4CAF50;">
                    ${order.promoCode ? `Discount (${order.promoCode}):` : 'Discount:'}
                  </td>
                  <td style="padding: 10px; text-align: right; color: #4CAF50;">-₹${discountAmount.toLocaleString('en-IN')}</td>
                </tr>
                ` : ''}
                <tr>
                  <td colspan="2" style="padding: 10px; text-align: right;">Shipping:</td>
                  <td style="padding: 10px; text-align: right; color: #4CAF50;">FREE</td>
                </tr>
                <tr class="total-row">
                  <td colspan="2" style="padding: 15px; text-align: right; border-top: 2px solid #333;">Total Amount:</td>
                  <td style="padding: 15px; text-align: right; border-top: 2px solid #333;">₹${finalTotal.toLocaleString('en-IN')}</td>
                </tr>
              </tfoot>
            </table>
            
            <h3 style="margin-top: 20px;">Shipping Address</h3>
            <p>
              ${order.shippingAddress.name}<br>
              ${order.shippingAddress.address}<br>
              ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}<br>
              Phone: ${order.shippingAddress.phone}
            </p>
          </div>
          
          <p>You can track your order status using the order ID: <strong>${order.orderNumber}</strong></p>
          <p>We'll send you another email when your order ships.</p>
        </div>
        
        <div class="footer">
          <p>Thank you for choosing OZME Perfumes</p>
          <p>© 2024 OZME. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

    const text = `
Order Confirmed - ${order.orderNumber}

Hi ${user.name || 'Valued Customer'},

Your order has been successfully placed!

Order ID: ${order.orderNumber}
Order Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}
Payment Method: ${order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Payment'}
${order.promoCode ? `Promo Code: ${order.promoCode}` : ''}

Subtotal: ₹${subtotal.toLocaleString('en-IN')}
${discountAmount > 0 ? `${order.promoCode ? `Discount (${order.promoCode}):` : 'Discount:'} -₹${discountAmount.toLocaleString('en-IN')}` : ''}
Shipping: FREE
Total Amount: ₹${finalTotal.toLocaleString('en-IN')}

Shipping Address:
${order.shippingAddress.name}
${order.shippingAddress.address}
${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}

Thank you for shopping with OZME Perfumes!
  `;

    return await sendEmail({
        to: user.email,
        subject,
        text,
        html,
    });
};

/**
 * Send order status update email
 * @param {Object} order - Order object
 * @param {Object} user - User object
 * @param {string} newStatus - New order status
 * @returns {Promise<Object>} Email send result
 */
export const sendOrderStatusEmail = async (order, user, newStatus) => {
    const statusMessages = {
        Processing: 'Your order is being prepared',
        Shipped: 'Your order has been shipped!',
        'Out for Delivery': 'Your order is out for delivery',
        Delivered: 'Your order has been delivered',
        Cancelled: 'Your order has been cancelled',
    };

    const subject = `Order Update: ${statusMessages[newStatus]} - ${order.orderNumber}`;

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #000 0%, #333 100%); color: white; padding: 30px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .status-badge { display: inline-block; padding: 10px 20px; background: #4CAF50; color: white; border-radius: 20px; font-weight: bold; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📦 Order Status Update</h1>
        </div>
        
        <div class="content">
          <p>Hi ${user.name || 'Valued Customer'},</p>
          <p><span class="status-badge">${statusMessages[newStatus]}</span></p>
          <p><strong>Order ID:</strong> ${order.orderNumber}</p>
          ${order.trackingNumber ? `<p><strong>Tracking Number:</strong> ${order.trackingNumber}</p>` : ''}
          ${newStatus === 'Delivered' ? '<p>🎉 We hope you enjoy your purchase!</p>' : ''}
          <p>Thank you for choosing OZME Perfumes!</p>
        </div>
        
        <div class="footer">
          <p>© 2024 OZME. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

    const text = `
Order Status Update

Hi ${user.name || 'Valued Customer'},

${statusMessages[newStatus]}

Order ID: ${order.orderNumber}
${order.trackingNumber ? `Tracking Number: ${order.trackingNumber}` : ''}

Thank you for choosing OZME Perfumes!
  `;

    return await sendEmail({
        to: user.email,
        subject,
        text,
        html,
    });
};
