import express from 'express';
import { sendEmail } from '../utils/sendEmail.js';

const router = express.Router();

/**
 * Test email endpoint for debugging SMTP configuration
 * @route GET /api/email/test
 * @query {string} to - Email address to send test email to (optional, defaults to ADMIN_NOTIFY_EMAIL)
 */
router.get('/test', async (req, res) => {
  try {
    const ADMIN_NOTIFY_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || process.env.ADMIN_EMAIL || process.env.EMAIL_USER || 'notify@ozme.in';
    const testEmail = req.query.to || ADMIN_NOTIFY_EMAIL;
    
    console.log(`🧪 Test email requested to: ${testEmail}`);

    const testSubject = '🧪 OZME Backend - Test Email';
    const testHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #000 0%, #333 100%); color: white; padding: 30px; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; }
          .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🧪 Test Email</h1>
          </div>
          <div class="content">
            <div class="success">
              <strong>✅ Success!</strong> This is a test email from OZME Backend.
            </div>
            <p>If you received this email, your SMTP configuration is working correctly.</p>
            <p><strong>Email Configuration:</strong></p>
            <ul>
              <li>Host: ${process.env.EMAIL_HOST || 'smtp.titan.email'}</li>
              <li>Port: ${process.env.EMAIL_PORT || 587}</li>
              <li>User: ${process.env.EMAIL_USER || 'Not set'}</li>
              <li>From: ${process.env.EMAIL_FROM || process.env.EMAIL_USER || 'Not set'}</li>
              <li>To: ${testEmail}</li>
            </ul>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const testText = `
Test Email from OZME Backend

✅ Success! This is a test email from OZME Backend.

If you received this email, your SMTP configuration is working correctly.

Email Configuration:
- Host: ${process.env.EMAIL_HOST || 'smtp.titan.email'}
- Port: ${process.env.EMAIL_PORT || 587}
- User: ${process.env.EMAIL_USER || 'Not set'}
- From: ${process.env.EMAIL_FROM || process.env.EMAIL_USER || 'Not set'}
- To: ${testEmail}

Timestamp: ${new Date().toISOString()}
    `;

    console.log(`📤 Sending test email to ${testEmail}...`);
    const result = await sendEmail({
      to: testEmail,
      subject: testSubject,
      text: testText,
      html: testHtml,
    });

    if (result.success) {
      console.log(`✅ Test email sent successfully to ${testEmail} - Message ID: ${result.messageId}`);
      res.status(200).json({
        success: true,
        message: 'Test email sent successfully',
        data: {
          to: testEmail,
          messageId: result.messageId,
          timestamp: new Date().toISOString(),
        },
      });
    } else {
      console.error(`❌ Test email failed to ${testEmail}:`, result.error || result.message);
      res.status(500).json({
        success: false,
        message: 'Failed to send test email',
        error: result.error || result.message,
        details: result.details || null,
      });
    }
  } catch (error) {
    console.error('❌ Test email exception:', {
      message: error.message,
      stack: error.stack,
      error: error
    });
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message,
      details: error.code || error.response || null,
    });
  }
});

export default router;

