import { sendEmail } from '../utils/sendEmail.js';

/**
 * Test email endpoint
 * @route GET /api/test-email
 * @access Public (for testing)
 */
export const testEmail = async (req, res) => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'notify@ozme.in';
    
    const testSubject = '🧪 OZME Backend - Test Email';
    const testHtml = `
      <!DOCTYPE html>
      <html>
      <head>
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
              <li>To: ${adminEmail}</li>
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
- To: ${adminEmail}

Timestamp: ${new Date().toISOString()}
    `;

    const result = await sendEmail({
      to: adminEmail,
      subject: testSubject,
      text: testText,
      html: testHtml,
    });

    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Test email sent successfully',
        data: {
          to: adminEmail,
          messageId: result.messageId,
          timestamp: new Date().toISOString(),
        },
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send test email',
        error: result.error || result.message,
        details: result.details || null,
      });
    }
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message,
      details: error.code || error.response || null,
    });
  }
};

