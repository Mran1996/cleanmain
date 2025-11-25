/**
 * Verify SMTP Configuration for Contact Form
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load .env.local if it exists
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

console.log('📧 SMTP Configuration Verification');
console.log('===================================\n');

const smtpHost = process.env.SMTP_HOST || process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT || '587';
const smtpUser = process.env.SMTP_USER || process.env.OUTLOOK_EMAIL;
const smtpPass = process.env.SMTP_PASS || process.env.OUTLOOK_PASSWORD;
const smtpFrom = process.env.SMTP_FROM || smtpUser;
const smtpTo = process.env.SMTP_TO || smtpUser;

console.log('Configuration Status:');
console.log('---------------------');
console.log('SMTP Host:', smtpHost || '❌ Not set (default: smtp.office365.com)');
console.log('SMTP Port:', smtpPort || '❌ Not set (default: 587)');
console.log('SMTP User:', smtpUser ? smtpUser.substring(0, 5) + '***' : '❌ Not set');
console.log('SMTP Password:', smtpPass ? '✅ Set (' + smtpPass.substring(0, 4) + '****)' : '❌ Not set');
console.log('From Email:', smtpFrom || '❌ Not set');
console.log('To Email (where messages go):', smtpTo || '❌ Not set');
console.log('');

if (!smtpUser || !smtpPass) {
  console.log('❌ SMTP credentials are missing!');
  console.log('\n💡 To fix this:');
  console.log('1. Open your .env.local file');
  console.log('2. Add these lines (replace with your actual Outlook email):');
  console.log('   SMTP_HOST=smtp.office365.com');
  console.log('   SMTP_PORT=587');
  console.log('   SMTP_USER=your_email@askailegal.com');
  console.log('   SMTP_PASS=your_outlook_app_password');
  console.log('   SMTP_FROM=your_email@askailegal.com');
  console.log('   SMTP_TO=your_email@askailegal.com');
  console.log('\n⚠️  Important:');
  console.log('   - You MUST use an App Password (not your regular password)');
  console.log('   - To create an App Password:');
  console.log('     1. Go to: https://account.microsoft.com/security');
  console.log('     2. Sign in with your Microsoft account');
  console.log('     3. Click "Advanced security options"');
  console.log('     4. Scroll to "App passwords"');
  console.log('     5. Click "Create a new app password"');
  console.log('     6. Copy the generated password');
  console.log('   - Two-factor authentication must be enabled first');
} else {
  console.log('✅ SMTP credentials are configured!');
  console.log('\n📬 Contact form emails will be sent to:', smtpTo);
  console.log('\n💡 To test:');
  console.log('1. Restart your dev server: npm run dev');
  console.log('2. Visit: http://localhost:3000/contact');
  console.log('3. Submit a test message');
}


