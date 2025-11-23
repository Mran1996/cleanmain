import { NextResponse } from 'next/server'

export async function GET() {
  // Check which environment variables are set (without exposing sensitive data)
  const config = {
    SMTP_USER: process.env.SMTP_USER ? '***SET***' : 'NOT SET',
    OUTLOOK_EMAIL: process.env.OUTLOOK_EMAIL ? '***SET***' : 'NOT SET',
    SMTP_PASS: process.env.SMTP_PASS ? '***SET***' : 'NOT SET',
    OUTLOOK_PASSWORD: process.env.OUTLOOK_PASSWORD ? '***SET***' : 'NOT SET',
    SMTP_HOST: process.env.SMTP_HOST || 'default (smtp.office365.com)',
    SMTP_PORT: process.env.SMTP_PORT || 'default (587)',
    SMTP_FROM: process.env.SMTP_FROM || 'NOT SET',
    SMTP_TO: process.env.SMTP_TO || 'NOT SET',
  }

  // Determine which email variable is being used
  const emailUsed = process.env.SMTP_USER || process.env.OUTLOOK_EMAIL || 'NONE'
  const passwordUsed = process.env.SMTP_PASS || process.env.OUTLOOK_PASSWORD || 'NONE'

  return NextResponse.json({
    message: 'SMTP Configuration Check',
    config,
    activeEmail: emailUsed !== 'NONE' ? '***SET***' : 'NOT SET',
    activePassword: passwordUsed !== 'NONE' ? '***SET***' : 'NOT SET',
    status: (emailUsed !== 'NONE' && passwordUsed !== 'NONE') ? 'READY' : 'MISSING CREDENTIALS',
    expectedVariables: [
      'SMTP_USER (or OUTLOOK_EMAIL) - Your Outlook email address',
      'SMTP_PASS (or OUTLOOK_PASSWORD) - Your Outlook app password',
      'SMTP_HOST (optional) - Defaults to smtp.office365.com (recommended) or smtp-mail.outlook.com',
      'SMTP_PORT (optional) - Defaults to 587',
      'SMTP_FROM (optional) - Email address to send from',
      'SMTP_TO (optional) - Email address to send to',
    ]
  })
}


