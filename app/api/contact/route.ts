import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

// Configure the email transporter for Brevo SMTP
const createTransporter = () => {
  const smtpConfig = {
    host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: false, // Brevo requires secure to be false for non-SSL ports
    tls: {
      rejectUnauthorized: false
    },
    auth: {
      user: process.env.SMTP_USER || '98ddc5001@smtp-brevo.com',
      pass: process.env.SMTP_PASS || 'YwFEcpOACxdghZs3',
    },
    debug: true,
    logger: true
  };

  console.log('SMTP Config:', {
    ...smtpConfig,
    auth: { user: smtpConfig.auth.user ? '***' : 'missing' }
  });

  if (!smtpConfig.auth.user || !smtpConfig.auth.pass) {
    throw new Error('SMTP authentication credentials are missing. Please check your environment variables.');
  }

  return nodemailer.createTransport(smtpConfig);
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

    const transporter = createTransporter()

    // Prepare email content
    let emailContent = `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Reason:</strong> ${reason}</p>
      <p><strong>Message:</strong></p>
      <p>${message}</p>
    `

    if (file && file.size > 0) {
      emailContent += `
        <p><strong>File Attached:</strong> ${file.name}</p>
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
