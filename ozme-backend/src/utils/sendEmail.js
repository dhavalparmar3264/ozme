import nodemailer from 'nodemailer';

/**
 * Create email transporter with Titan SMTP configuration
 * @returns {Object} Nodemailer transporter or null if not configured
 */
const createTransporter = () => {
  // Ensure EMAIL_PASSWORD is treated as string (handle quotes in .env)
  // Also handle passwords with special characters that might be URL-encoded or have spaces
  let emailPassword = process.env.EMAIL_PASSWORD;
  if (emailPassword) {
    emailPassword = String(emailPassword)
      .replace(/^["']|["']$/g, '') // Remove surrounding quotes
      .trim(); // Remove leading/trailing spaces
  }
  
  const emailHost = process.env.EMAIL_HOST || 'smtp.titan.email';
  const emailPort = Number(process.env.EMAIL_PORT) || 587;
  const emailUser = process.env.EMAIL_USER;
  // EMAIL_SECURE: 'true' or 'false' string, or undefined (defaults to false for port 587)
  const emailSecure = process.env.EMAIL_SECURE === 'true' || process.env.EMAIL_SECURE === '1';
  
  if (!emailHost || !emailUser || !emailPassword) {
    console.log('⚠️  Email configuration check:');
    console.log(`  EMAIL_HOST: ${emailHost ? `✓ Set (${emailHost})` : '✗ Missing'}`);
    console.log(`  EMAIL_PORT: ${emailPort ? `✓ Set (${emailPort})` : '✗ Missing'}`);
    console.log(`  EMAIL_USER: ${emailUser ? `✓ Set (${emailUser})` : '✗ Missing'}`);
    console.log(`  EMAIL_PASSWORD: ${emailPassword ? `✓ Set (length: ${emailPassword.length})` : '✗ Missing'}`);
    console.log(`  EMAIL_SECURE: ${emailSecure ? '✓ Set (true)' : '✗ Not set (defaults to false for TLS)'}`);
    console.log(`  EMAIL_FROM: ${process.env.EMAIL_FROM || 'Not set (will use EMAIL_USER)'}`);
    console.log(`  ADMIN_NOTIFY_EMAIL: ${process.env.ADMIN_NOTIFY_EMAIL || process.env.ADMIN_EMAIL || 'Not set'}`);
    return null; // Email not configured
  }

  // For port 587, use secure: false (TLS), for port 465 use secure: true (SSL)
  const useSecure = emailSecure || emailPort === 465;
  
  // Enable debug logging if EMAIL_DEBUG is set
  const emailDebug = process.env.EMAIL_DEBUG === 'true' || process.env.EMAIL_DEBUG === '1';

  if (emailDebug) {
    console.log(`📧 Creating email transporter with DEBUG enabled: ${emailHost}:${emailPort} (secure: ${useSecure})`);
  }

  const transporterConfig = {
    host: emailHost,
    port: emailPort,
    secure: useSecure, // true for SSL (port 465), false for TLS (port 587)
    requireTLS: !useSecure && emailPort === 587, // Require TLS for port 587
    auth: {
      user: emailUser,
      pass: emailPassword,
    },
    tls: {
      // Do not fail on invalid certificates (helps with some SMTP servers)
      rejectUnauthorized: false,
    },
    connectionTimeout: 30000, // 30 seconds
    greetingTimeout: 30000, // 30 seconds
    socketTimeout: 30000, // 30 seconds
  };

  // Add debug options if EMAIL_DEBUG is enabled
  if (emailDebug) {
    transporterConfig.logger = true;
    transporterConfig.debug = true;
  }

  return nodemailer.createTransport(transporterConfig);
};

/**
 * Send email using Titan SMTP
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Email text content (optional)
 * @param {string} options.html - Email HTML content (optional)
 * @returns {Promise<Object>} Email send result
 */
export const sendEmail = async ({ to, subject, text, html }) => {
  const transporter = createTransporter();

  if (!transporter) {
    console.warn('⚠️  Email not configured. Skipping email send.');
    return { success: false, message: 'Email not configured' };
  }

  if (!to || !subject) {
    console.error('❌ Email send failed: Missing required fields (to, subject)');
    return { success: false, error: 'Missing required email fields' };
  }

  try {
    // Parse EMAIL_FROM - it might be in format "Name <email@domain.com>" or just "email@domain.com"
    let fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;
    
    if (!fromEmail) {
      console.error('❌ EMAIL_FROM or EMAIL_USER not set - cannot send email');
      return { success: false, error: 'EMAIL_FROM or EMAIL_USER not configured' };
    }

    // Extract email address from EMAIL_FROM if it contains angle brackets
    let fromAddress = fromEmail;
    let fromName = 'OZME Perfumery';
    
    const emailMatch = fromEmail.match(/<(.+)>/);
    if (emailMatch) {
      // Format: "Name <email@domain.com>"
      fromAddress = emailMatch[1];
      const nameMatch = fromEmail.match(/^(.+?)\s*</);
      if (nameMatch) {
        fromName = nameMatch[1].replace(/^["']|["']$/g, ''); // Remove quotes if present
      }
    } else {
      // Format: just "email@domain.com"
      fromAddress = fromEmail;
    }

    console.log(`📤 Attempting to send email to ${to} from ${fromName} <${fromAddress}>`);
    console.log(`   Subject: ${subject}`);

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to,
      subject,
      text: text || html?.replace(/<[^>]*>/g, '') || '', // Strip HTML if no text provided
      html: html || text || '',
    });

    console.log(`✅ Email sent successfully to ${to}`);
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Response: ${info.response || 'N/A'}`);
    return { success: true, messageId: info.messageId, response: info.response };
  } catch (error) {
    // Log detailed error information
    console.error('❌ Email send error:', {
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
      message: error.message,
    });
    
    // Provide helpful error messages for common SMTP errors
    if (error.code === 'EAUTH' || error.responseCode === 535 || (error.response && error.response.includes('authentication failed'))) {
      console.error('❌ SMTP Authentication Failed!');
      console.error(`   Error Code: ${error.code || 'N/A'}`);
      console.error(`   Response Code: ${error.responseCode || 'N/A'}`);
      console.error(`   Response: ${error.response || error.message || 'N/A'}`);
      console.error(`   EMAIL_USER: ${process.env.EMAIL_USER || 'Not set'}`);
      console.error(`   EMAIL_PASSWORD length: ${process.env.EMAIL_PASSWORD ? process.env.EMAIL_PASSWORD.length : 'Not set'}`);
      console.error('💡 Common causes:');
      console.error('   1. Incorrect EMAIL_USER or EMAIL_PASSWORD');
      console.error('   2. EMAIL_PASSWORD has extra spaces, quotes, or special characters');
      console.error('   3. Titan Email SMTP access not enabled');
      console.error('   4. Using wrong password (need app password if 2FA enabled)');
      console.error('   5. Password contains @ symbols that might need URL encoding');
      console.error('📝 Solution:');
      console.error('   1. Verify EMAIL_USER matches your Titan email exactly');
      console.error('   2. Check EMAIL_PASSWORD in .env (ensure no extra quotes/spaces)');
      console.error('   3. If password has @ symbols, try wrapping in quotes: EMAIL_PASSWORD="@Ozme@Updates@0911"');
      console.error('   4. Ensure SMTP is enabled in Titan Email settings');
      console.error('   5. Try regenerating password if 2FA is enabled');
      return { 
        success: false, 
        error: 'SMTP authentication failed. Check EMAIL_USER and EMAIL_PASSWORD. See console for details.',
        details: error.response || error.message
      };
    }
    
    if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT' || error.message?.includes('Connection closed') || error.message?.includes('socket close')) {
      console.error('❌ SMTP Connection Failed!');
      console.error(`   Error Code: ${error.code || 'N/A'}`);
      console.error(`   Error Message: ${error.message || 'N/A'}`);
      console.error('💡 Possible causes:');
      console.error('   1. EMAIL_HOST is incorrect (should be smtp.titan.email)');
      console.error('   2. EMAIL_PORT is incorrect (should be 587 for TLS)');
      console.error('   3. Firewall blocking outbound connections on port 587');
      console.error('   4. Titan SMTP server is down or unreachable');
      console.error('   5. Network connectivity issues');
      console.error('   6. SMTP server closing connection (check Titan Email settings)');
      console.error('📝 Solution:');
      console.error('   1. Verify EMAIL_HOST and EMAIL_PORT in .env');
      console.error('   2. Check firewall rules allow outbound port 587');
      console.error('   3. Test network connectivity: telnet smtp.titan.email 587');
      console.error('   4. Verify SMTP is enabled in Titan Email account settings');
      return {
        success: false,
        error: 'SMTP connection failed. Connection closed unexpectedly. Check network and SMTP settings.',
        details: error.message || error.code
      };
    }
    
    return { 
      success: false, 
      error: error.message || 'Unknown email error',
      details: error.response || error.code
    };
  }
};

/**
 * Verify SMTP connection on server startup
 * @returns {Promise<boolean>} True if SMTP is verified, false otherwise
 */
export const verifySMTPConnection = async () => {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.log('⚠️  SMTP not configured - email functionality disabled');
    console.log('   Please check EMAIL_HOST, EMAIL_USER, and EMAIL_PASSWORD in .env');
    return false;
  }

  console.log('🔍 Verifying SMTP connection...');
  console.log(`   Host: ${process.env.EMAIL_HOST || 'smtp.titan.email'}`);
  console.log(`   Port: ${Number(process.env.EMAIL_PORT) || 587}`);
  console.log(`   User: ${process.env.EMAIL_USER}`);
  console.log(`   Password length: ${process.env.EMAIL_PASSWORD ? process.env.EMAIL_PASSWORD.length : 'Not set'}`);

  try {
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!');
    console.log('   Email functionality is enabled');
    return true;
  } catch (error) {
    console.error('❌ SMTP connection verification FAILED:');
    console.error(`   Error Code: ${error.code || 'N/A'}`);
    console.error(`   Response Code: ${error.responseCode || 'N/A'}`);
    console.error(`   Error Message: ${error.message || 'N/A'}`);
    console.error(`   SMTP Response: ${error.response || 'N/A'}`);
    console.error('');
    console.error('💡 Troubleshooting steps:');
    console.error('   1. Verify EMAIL_USER and EMAIL_PASSWORD are correct');
    console.error('   2. Check if SMTP access is enabled in Titan Email settings');
    console.error('   3. If 2FA is enabled, use an app-specific password');
    console.error('   4. Ensure EMAIL_PASSWORD has no extra spaces or quotes');
    console.error('   5. Try wrapping password in quotes if it starts with special characters');
    console.error('');
    console.error('⚠️  Email sending will FAIL until SMTP is configured correctly');
    console.error('   Orders will still be created, but notification emails will not be sent');
    return false;
  }
};

/**
 * Send contact form notification email
 * @param {Object} contactData - Contact form data
 * @returns {Promise<Object>} Email send result
 */
export const sendContactEmail = async (contactData) => {
  const { name, email, phone, category, message } = contactData;

  const subject = `New Contact Form Submission - ${category}`;
  const text = `
    New contact form submission from OZME website:
    
    Name: ${name}
    Email: ${email}
    Phone: ${phone || 'Not provided'}
    Category: ${category}
    
    Message:
    ${message}
  `;

  const html = `
    <h2>New Contact Form Submission</h2>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
    <p><strong>Category:</strong> ${category}</p>
    <h3>Message:</h3>
    <p>${message.replace(/\n/g, '<br>')}</p>
  `;

  return await sendEmail({
    to: process.env.EMAIL_FROM || 'support@ozme.in',
    subject,
    text,
    html,
  });
};

