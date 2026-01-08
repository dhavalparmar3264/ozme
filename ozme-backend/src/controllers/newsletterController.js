import NewsletterSubscriber from '../models/NewsletterSubscriber.js';
import { sendEmail } from '../utils/sendEmail.js';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'notify@ozme.in';

/**
 * Subscribe to newsletter
 * @route POST /api/newsletter/subscribe
 */
export const subscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    // Basic email validation
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    console.log(`📧 Newsletter subscription attempt for: ${normalizedEmail}`);

    // Check if subscriber already exists
    let subscriber = await NewsletterSubscriber.findOne({ email: normalizedEmail });
    const isNewSubscriber = !subscriber;

    // Create subscriber if doesn't exist
    if (!subscriber) {
      subscriber = await NewsletterSubscriber.create({ email: normalizedEmail });
      console.log(`✅ New subscriber created: ${normalizedEmail} (ID: ${subscriber._id})`);
    } else {
      console.log(`ℹ️  Subscriber already exists: ${normalizedEmail} (subscribed: ${subscriber.createdAt})`);
    }

    // Track email sending results
    let welcomeEmailSent = false;
    let adminEmailSent = false;
    let emailErrors = [];

    // Send welcome email to subscriber (always send, even if already subscribed)
    try {
      const welcomeSubject = 'Welcome to OZME Perfumes ✨';
      const welcomeHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #111; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="margin: 0 0 8px;">Welcome to OZME Perfumes ✨</h2>
          <p style="margin: 0 0 12px;">
            Thanks for subscribing! You're now on the list for exclusive launches, restocks, and special offers.
          </p>

          <div style="background:#f7f7f7; padding:14px; border-radius:10px; margin: 14px 0;">
            <p style="margin:0; font-size: 14px;">🎁 <strong>Your subscriber perk:</strong> Get 10% off your first order</p>
            <p style="margin:6px 0 0; font-size: 14px;">
              Use code: <strong>WELCOME10</strong> <span style="color:#666;">(if applicable)</span>
            </p>
          </div>

          <h3 style="margin: 18px 0 8px;">We'd love your perfume review 💬</h3>
          <p style="margin: 0 0 12px;">
            If you've tried any OZME fragrances, please reply to this email with:
          </p>

          <ul style="margin: 0 0 14px; padding-left: 18px;">
            <li><strong>Perfume name</strong></li>
            <li><strong>Rating</strong> (1–5)</li>
            <li><strong>What you loved</strong> (scent, longevity, compliments, etc.)</li>
            <li><strong>Your name</strong> (optional — we can feature it on the website)</li>
          </ul>

          <p style="margin: 0 0 14px;">
            Your feedback helps others choose the perfect fragrance and helps us improve.
          </p>

          <p style="margin: 0 0 6px;"><strong>Need help picking a scent?</strong></p>
          <p style="margin: 0 0 14px;">
            Reply with what you like (fresh / woody / sweet / spicy) and we'll recommend something you'll love.
          </p>

          <p style="margin: 0;">
            — Team OZME<br/>
            <span style="color:#666;">OZME Perfumes</span>
          </p>
        </body>
        </html>
      `;
      const welcomeText = `
Welcome to OZME Perfumes ✨

Thanks for subscribing! You're now on the list for exclusive launches, restocks, and special offers.

🎁 Your subscriber perk: Get 10% off your first order
Use code: WELCOME10 (if applicable)

We'd love your perfume review 💬
If you've tried any OZME fragrances, please reply to this email with:
- Perfume name
- Rating (1–5)
- What you loved (scent, longevity, compliments, etc.)
- Your name (optional — we can feature it on the website)

Your feedback helps others choose the perfect fragrance and helps us improve.

Need help picking a scent?
Reply with what you like (fresh / woody / sweet / spicy) and we'll recommend something you'll love.

— Team OZME
OZME Perfumes
      `;

      console.log(`📤 Sending welcome email to subscriber: ${normalizedEmail}`);
      const emailResult = await sendEmail({
        to: normalizedEmail,
        subject: welcomeSubject,
        text: welcomeText,
        html: welcomeHtml,
      });

      if (emailResult.success) {
        welcomeEmailSent = true;
        console.log(`✅ Welcome email sent successfully to ${normalizedEmail} - Message ID: ${emailResult.messageId}`);
      } else {
        emailErrors.push(`Welcome email failed: ${emailResult.error || emailResult.message}`);
        console.error(`❌ Failed to send welcome email to ${normalizedEmail}:`, emailResult.error || emailResult.message);
      }
    } catch (emailError) {
      emailErrors.push(`Welcome email error: ${emailError.message || emailError}`);
      console.error(`❌ Exception sending welcome email to ${normalizedEmail}:`, {
        message: emailError.message,
        stack: emailError.stack,
        error: emailError
      });
    }

    // Send internal alert email to notify@ozme.in (non-blocking)
    try {
      const alertSubject = `📧 ${isNewSubscriber ? 'New' : 'Existing'} Newsletter Subscriber - OZME`;
      const alertHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">📧 ${isNewSubscriber ? 'New' : 'Existing'} Newsletter Subscriber</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
            <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #4CAF50;">
              <p style="margin: 0 0 8px;"><strong>Email:</strong> ${normalizedEmail}</p>
              <p style="margin: 0 0 8px;"><strong>Status:</strong> ${isNewSubscriber ? 'New Subscriber' : 'Already Subscribed'}</p>
              <p style="margin: 0;"><strong>Subscribed At:</strong> ${new Date(subscriber.createdAt).toLocaleString('en-IN', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
              })}</p>
            </div>
            <p style="margin: 0;">${isNewSubscriber ? 'A new subscriber has joined' : 'An existing subscriber has resubscribed to'} the OZME newsletter!</p>
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 12px;">
              <p style="margin: 0;">This is an automated notification from OZME Perfumery</p>
              <p style="margin: 4px 0 0;">© ${new Date().getFullYear()} OZME. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;
      const alertText = `
${isNewSubscriber ? 'New' : 'Existing'} Newsletter Subscriber - OZME

Email: ${normalizedEmail}
Status: ${isNewSubscriber ? 'New Subscriber' : 'Already Subscribed'}
Subscribed At: ${new Date(subscriber.createdAt).toLocaleString('en-IN')}

${isNewSubscriber ? 'A new subscriber has joined' : 'An existing subscriber has resubscribed to'} the OZME newsletter!
      `;

      console.log(`📤 Sending admin notification email to: ${ADMIN_EMAIL}`);
      const adminEmailResult = await sendEmail({
        to: ADMIN_EMAIL,
        subject: alertSubject,
        text: alertText,
        html: alertHtml,
      });

      if (adminEmailResult.success) {
        adminEmailSent = true;
        console.log(`✅ Admin notification email sent successfully to ${ADMIN_EMAIL} - Message ID: ${adminEmailResult.messageId}`);
      } else {
        emailErrors.push(`Admin email failed: ${adminEmailResult.error || adminEmailResult.message}`);
        console.error(`❌ Failed to send admin notification email to ${ADMIN_EMAIL}:`, adminEmailResult.error || adminEmailResult.message);
      }
    } catch (emailError) {
      emailErrors.push(`Admin email error: ${emailError.message || emailError}`);
      console.error(`❌ Exception sending admin notification email to ${ADMIN_EMAIL}:`, {
        message: emailError.message,
        stack: emailError.stack,
        error: emailError
      });
    }

    // Build response message
    let responseMessage = isNewSubscriber 
      ? 'Successfully subscribed to newsletter' 
      : 'You are already subscribed to our newsletter';
    
    // Add email delivery status to message if there were issues
    if (emailErrors.length > 0) {
      responseMessage += '. Note: Email delivery had issues - please check server logs.';
      console.warn(`⚠️  Newsletter subscription completed with email errors for ${normalizedEmail}:`, emailErrors);
    } else if (!welcomeEmailSent && !adminEmailSent) {
      responseMessage += '. Note: Emails could not be sent - please check SMTP configuration.';
      console.warn(`⚠️  Newsletter subscription completed but no emails were sent for ${normalizedEmail}`);
    }

    console.log(`✅ Newsletter subscription completed for ${normalizedEmail} - Welcome: ${welcomeEmailSent ? '✓' : '✗'}, Admin: ${adminEmailSent ? '✓' : '✗'}`);

    res.status(200).json({
      success: true,
      message: responseMessage,
      data: {
        subscriber: {
          email: subscriber.email,
          subscribedAt: subscriber.createdAt,
        },
        emailStatus: {
          welcomeEmailSent,
          adminEmailSent,
          errors: emailErrors.length > 0 ? emailErrors : undefined,
        },
      },
    });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to subscribe to newsletter',
    });
  }
};

/**
 * Test newsletter email endpoint (for debugging)
 * @route GET /api/newsletter/test-email
 * @query {string} to - Email address to send test email to (optional, defaults to notify@ozme.in)
 */
export const testNewsletterEmail = async (req, res) => {
  try {
    const testEmail = req.query.to || process.env.ADMIN_EMAIL || 'notify@ozme.in';
    
    console.log(`🧪 Testing newsletter email to: ${testEmail}`);

    const welcomeSubject = 'Welcome to OZME Perfumes ✨ (TEST)';
    const welcomeHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #111; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
          <strong>🧪 TEST EMAIL</strong> - This is a test of the newsletter welcome email template.
        </div>
        <h2 style="margin: 0 0 8px;">Welcome to OZME Perfumes ✨</h2>
        <p style="margin: 0 0 12px;">
          Thanks for subscribing! You're now on the list for exclusive launches, restocks, and special offers.
        </p>

        <div style="background:#f7f7f7; padding:14px; border-radius:10px; margin: 14px 0;">
          <p style="margin:0; font-size: 14px;">🎁 <strong>Your subscriber perk:</strong> Get 10% off your first order</p>
          <p style="margin:6px 0 0; font-size: 14px;">
            Use code: <strong>WELCOME10</strong> <span style="color:#666;">(if applicable)</span>
          </p>
        </div>

        <h3 style="margin: 18px 0 8px;">We'd love your perfume review 💬</h3>
        <p style="margin: 0 0 12px;">
          If you've tried any OZME fragrances, please reply to this email with:
        </p>

        <ul style="margin: 0 0 14px; padding-left: 18px;">
          <li><strong>Perfume name</strong></li>
          <li><strong>Rating</strong> (1–5)</li>
          <li><strong>What you loved</strong> (scent, longevity, compliments, etc.)</li>
          <li><strong>Your name</strong> (optional — we can feature it on the website)</li>
        </ul>

        <p style="margin: 0 0 14px;">
          Your feedback helps others choose the perfect fragrance and helps us improve.
        </p>

        <p style="margin: 0 0 6px;"><strong>Need help picking a scent?</strong></p>
        <p style="margin: 0 0 14px;">
          Reply with what you like (fresh / woody / sweet / spicy) and we'll recommend something you'll love.
        </p>

        <p style="margin: 0;">
          — Team OZME<br/>
          <span style="color:#666;">OZME Perfumes</span>
        </p>
      </body>
      </html>
    `;
    const welcomeText = `
Welcome to OZME Perfumes ✨ (TEST EMAIL)

Thanks for subscribing! You're now on the list for exclusive launches, restocks, and special offers.

🎁 Your subscriber perk: Get 10% off your first order
Use code: WELCOME10 (if applicable)

We'd love your perfume review 💬
If you've tried any OZME fragrances, please reply to this email with:
- Perfume name
- Rating (1–5)
- What you loved (scent, longevity, compliments, etc.)
- Your name (optional — we can feature it on the website)

Your feedback helps others choose the perfect fragrance and helps us improve.

Need help picking a scent?
Reply with what you like (fresh / woody / sweet / spicy) and we'll recommend something you'll love.

— Team OZME
OZME Perfumes
    `;

    const result = await sendEmail({
      to: testEmail,
      subject: welcomeSubject,
      text: welcomeText,
      html: welcomeHtml,
    });

    if (result.success) {
      console.log(`✅ Test newsletter email sent successfully to ${testEmail} - Message ID: ${result.messageId}`);
      res.status(200).json({
        success: true,
        message: 'Test newsletter email sent successfully',
        data: {
          to: testEmail,
          messageId: result.messageId,
          timestamp: new Date().toISOString(),
        },
      });
    } else {
      console.error(`❌ Test newsletter email failed to ${testEmail}:`, result.error || result.message);
      res.status(500).json({
        success: false,
        message: 'Failed to send test newsletter email',
        error: result.error || result.message,
        details: result.details || null,
      });
    }
  } catch (error) {
    console.error('Test newsletter email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test newsletter email',
      error: error.message,
      details: error.code || error.response || null,
    });
  }
};

