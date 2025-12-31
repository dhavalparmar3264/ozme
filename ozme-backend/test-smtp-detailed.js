import 'dotenv/config';
import nodemailer from 'nodemailer';

console.log('🔍 Detailed SMTP Connection Test for Titan Email\n');
console.log('Configuration:');
console.log(`  EMAIL_HOST: ${process.env.EMAIL_HOST}`);
console.log(`  EMAIL_PORT: ${process.env.EMAIL_PORT}`);
console.log(`  EMAIL_USER: ${process.env.EMAIL_USER}`);
console.log(`  EMAIL_PASSWORD length: ${process.env.EMAIL_PASSWORD?.length}`);
console.log(`  EMAIL_PASSWORD (first char): ${process.env.EMAIL_PASSWORD?.[0]}\n`);

const password = process.env.EMAIL_PASSWORD?.replace(/^["']|["']$/g, '').trim();

// Test Port 587 (TLS)
console.log('📧 Testing Port 587 (TLS)...');
const transporter587 = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: password,
  },
  tls: {
    rejectUnauthorized: false,
  },
  debug: true,
  logger: true,
  connectionTimeout: 30000,
  greetingTimeout: 30000,
  socketTimeout: 30000,
});

transporter587.verify((err, success) => {
  if (err) {
    console.error('❌ Port 587 Failed:');
    console.error(`   Error: ${err.message}`);
    console.error(`   Code: ${err.code}`);
    console.error(`   Response: ${err.response}\n`);
  } else {
    console.log('✅ Port 587 (TLS) Verified Successfully!\n');
  }
  
  // Test Port 465 (SSL)
  console.log('📧 Testing Port 465 (SSL)...');
  const transporter465 = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: password,
    },
    tls: {
      rejectUnauthorized: false,
    },
    debug: true,
    logger: true,
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,
  });

  transporter465.verify((err2, success2) => {
    if (err2) {
      console.error('❌ Port 465 Failed:');
      console.error(`   Error: ${err2.message}`);
      console.error(`   Code: ${err2.code}`);
      console.error(`   Response: ${err2.response}\n`);
    } else {
      console.log('✅ Port 465 (SSL) Verified Successfully!\n');
    }
    
    console.log('\n💡 If both ports fail with "Connection closed":');
    console.log('   1. Check Titan Email account settings - SMTP must be enabled');
    console.log('   2. Verify the password is correct (try logging into webmail)');
    console.log('   3. Check if IP whitelisting is required');
    console.log('   4. Contact Titan Email support if SMTP is enabled but still failing');
    
    process.exit(0);
  });
});

