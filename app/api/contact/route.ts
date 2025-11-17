import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

// Configure the email transporter for Outlook/Office 365 SMTP
const createTransporter = () => {
  const smtpConfig = {
    host: process.env.SMTP_HOST || 'smtp-mail.outlook.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: false, // Use STARTTLS for port 587
    tls: {
      ciphers: 'SSLv3',
      rejectUnauthorized: false
    },
    auth: {
      user: process.env.SMTP_USER || process.env.OUTLOOK_EMAIL, // Your Outlook email (e.g., support@askailegal.com)
      pass: process.env.SMTP_PASS || process.env.OUTLOOK_PASSWORD, // Your Outlook password or app password
    },
    debug: true,
    logger: true
  };

  console.log('SMTP Config (Outlook):', {
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.secure,
    auth: { user: smtpConfig.auth.user ? '***' : 'missing' }
  });

  if (!smtpConfig.auth.user || !smtpConfig.auth.pass) {
    throw new Error('Outlook SMTP authentication credentials are missing. Please set SMTP_USER/SMTP_PASS or OUTLOOK_EMAIL/OUTLOOK_PASSWORD environment variables.');
  }

  return nodemailer.createTransport(smtpConfig);
}

// In-memory cache to prevent duplicate submissions (clears after 5 seconds)
const recentSubmissions = new Map<string, number>()

// Clean up old entries every 10 seconds
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, timestamp] of recentSubmissions.entries()) {
      if (now - timestamp > 5000) {
        recentSubmissions.delete(key)
      }
    }
  }, 10000)
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const reason = formData.get('reason') as string
    const message = formData.get('message') as string
    const file = formData.get('file') as File | null

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      )
    }

    // Create a unique key for this submission (email + message hash + timestamp)
    const messageHash = message.substring(0, 50).replace(/\s/g, '')
    const submissionKey = `${email}-${messageHash}-${Math.floor(Date.now() / 1000)}`
    
    // Check if this is a duplicate submission within the last 5 seconds
    const now = Date.now()
    for (const [key, timestamp] of recentSubmissions.entries()) {
      if (key.startsWith(`${email}-${messageHash}`) && now - timestamp < 5000) {
        console.log('❌ Duplicate submission detected on server side, ignoring')
        return NextResponse.json(
          { error: 'Duplicate submission detected. Please wait a moment before submitting again.' },
          { status: 429 }
        )
      }
    }
    
    // Record this submission
    recentSubmissions.set(submissionKey, now)

    const transporter = createTransporter()

    // Escape HTML to prevent XSS in email content
    const escapeHtml = (text: string): string => {
      if (!text) return ''
      return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
    }

    // Prepare email content with escaped user input
    let emailContent = `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Reason:</strong> ${escapeHtml(reason || 'Not specified')}</p>
      <p><strong>Message:</strong></p>
      <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
    `

    if (file && file.size > 0) {
      emailContent += `
        <p><strong>File Attached:</strong> ${escapeHtml(file.name)}</p>
        <p><strong>File Size:</strong> ${(file.size / 1024).toFixed(2)} KB</p>
      `
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || 'support@askailegal.com',
      to: 'support@askailegal.com',
      subject: `Contact Form: ${reason} - ${name}`,
      html: emailContent,
      attachments: file && file.size > 0 ? [{
        filename: file.name,
        content: Buffer.from(await file.arrayBuffer()),
      }] : [],
    }

    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);

    return NextResponse.json({ 
      success: true,
      messageId: info.messageId 
    })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
