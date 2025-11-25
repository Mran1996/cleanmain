/**
 * Test SMTP Connection
 * This script tests if SMTP credentials are working
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import nodemailer from 'nodemailer';

// Load .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const smtpConfig = {
  host: process.env.SMTP_HOST || 'smtp.office365.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.SMTP_USER || process.env.OUTLOOK_EMAIL,
    pass: process.env.SMTP_PASS || process.env.OUTLOOK_PASSWORD,
  },
};

console.log('🧪 Testing SMTP Connection...\n');

if (!smtpConfig.auth.user || !smtpConfig.auth.pass) {
  console.log('❌ SMTP credentials missing!');
  console.log('   Set SMTP_USER and SMTP_PASS in .env.local');
  process.exit(1);
}

console.log('Configuration:');
console.log('  Host:', smtpConfig.host);
console.log('  Port:', smtpConfig.port);
console.log('  User:', smtpConfig.auth.user);
console.log('  Password:', smtpConfig.auth.pass ? '***' : 'missing');
console.log('');

const transporter = nodemailer.createTransport(smtpConfig);

// Test connection
transporter.verify((error, success) => {
  if (error) {
    console.log('❌ SMTP Connection Failed!');
    console.log('   Error:', error.message);
    console.log('');
    
    if (error.code === 'EAUTH' || error.message.includes('authentication')) {
      console.log('💡 This is an authentication error.');
      console.log('   Make sure you are using an App Password (not your regular password).');
      console.log('   To create an App Password:');
      console.log('   1. Go to: https://account.microsoft.com/security');
      console.log('   2. Advanced security options → App passwords');
      console.log('   3. Create a new app password');
      console.log('   4. Use that password in SMTP_PASS');
    }
    process.exit(1);
  } else {
    console.log('✅ SMTP Connection Successful!');
    console.log('   Your SMTP credentials are working correctly.');
    console.log('');
    console.log('📬 Contact form emails will be sent to:', process.env.SMTP_TO || smtpConfig.auth.user);
    process.exit(0);
  }
});


