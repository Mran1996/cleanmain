import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

const recentSubmissions = new Map<string, number>()

if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, ts] of recentSubmissions.entries()) {
      if (now - ts > 60000) recentSubmissions.delete(key)
    }
  }, 30000)
}

async function sendEmailViaBrevo(
  to: string,
  subject: string,
  htmlContent: string,
  attachments?: Array<{ name: string; content: string; contentType: string }>,
  replyTo?: string
) {
  const host = process.env.SMTP_HOST || 'smtp-relay.brevo.com'
  const port = parseInt(process.env.SMTP_PORT || '587', 10)
  const secure = (process.env.SMTP_SECURE === 'true') || port === 465
  const user = process.env.SMTP_USER || process.env.SMTP_FROM || 'support@askailegal.com'
  const pass = process.env.SMTP_PASS
  const fromEmail = process.env.SMTP_FROM || user

  if (!host || !port || !user || !pass) {
    throw new Error('SMTP configuration is missing. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env.local')
  }

  const transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } })

  const mailOptions: any = { from: fromEmail, to, subject, html: htmlContent }
  if (replyTo) mailOptions.replyTo = replyTo
  if (attachments && attachments.length > 0) {
    mailOptions.attachments = attachments.map(att => ({ filename: att.name, content: att.content, contentType: att.contentType, encoding: 'base64' }))
  }

  const info = await transporter.sendMail(mailOptions)
  return { messageId: info.messageId || `smtp-${Date.now()}` }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const name = (formData.get('name') as string)?.trim() || ''
    const email = (formData.get('email') as string)?.trim() || ''
    const reason = (formData.get('reason') as string)?.trim() || ''
    const message = (formData.get('message') as string)?.trim() || ''
    const file = formData.get('file') as File | null

    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 })
    if (!message) return NextResponse.json({ error: 'Message is required' }, { status: 400 })

    const messageHash = Buffer.from(message.trim().toLowerCase()).toString('base64').substring(0, 32)
    const submissionKey = `${email.toLowerCase().trim()}-${messageHash}`
    const now = Date.now()
    const existingTimestamp = recentSubmissions.get(submissionKey)
    if (existingTimestamp && now - existingTimestamp < 30000) return NextResponse.json({ error: 'Duplicate submission detected. Please wait a moment before submitting again.' }, { status: 429 })
    recentSubmissions.set(submissionKey, now)

    const escapeHtml = (text: string): string => {
      if (!text) return ''
      return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
    }

    let emailContent = `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Reason:</strong> ${escapeHtml(reason || 'Not specified')}</p>
      <p><strong>Message:</strong></p>
      <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
    `

    const toEmail = process.env.SMTP_TO || process.env.SMTP_USER || 'support@askailegal.com'
    const subject = `Contact Form: ${reason} - ${name}`

    let attachments: Array<{ name: string; content: string; contentType: string }> | undefined
    if (file && file.size > 0) {
      const fileBuffer = await file.arrayBuffer()
      const fileBase64 = Buffer.from(fileBuffer).toString('base64')
      attachments = [{ name: file.name, content: fileBase64, contentType: file.type || 'application/octet-stream' }]
      emailContent += `
        <p><strong>File Attached:</strong> ${escapeHtml(file.name)}</p>
        <p><strong>File Size:</strong> ${(file.size / 1024).toFixed(2)} KB</p>
      `
    }

    try {
      const info = await sendEmailViaBrevo(toEmail, subject, emailContent, attachments, email)
      return NextResponse.json({ success: true, messageId: info.messageId })
    } catch (emailError: any) {
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({ success: true, messageId: `dev-${Date.now()}`, warning: 'Email sending failed in development mode. Form submission was recorded.' })
      }
      throw emailError
    }
  } catch (error: any) {
    let errorMessage = error?.message || 'Failed to send message'
    let errorCode = error?.code || 'UNKNOWN_ERROR'
    if (errorMessage.includes('SMTP configuration')) { errorMessage = 'SMTP configuration error. Please verify SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env.local.'; errorCode = 'SMTP_CONFIG_ERROR' }
    if (errorMessage.includes('Invalid login') || errorMessage.includes('AUTH')) { errorMessage = 'SMTP authentication failed. Please verify Brevo SMTP username and key.'; errorCode = 'SMTP_AUTH_ERROR' }
    if (errorMessage.includes('getaddrinfo') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('ETIMEDOUT')) { errorMessage = 'SMTP connection error. Please verify host, port, and network connectivity.'; errorCode = 'SMTP_CONNECTION_ERROR' }
    return NextResponse.json({ error: errorMessage, code: errorCode, details: process.env.NODE_ENV === 'development' ? error?.stack : undefined, troubleshooting: process.env.NODE_ENV === 'development' ? { smtpHost: process.env.SMTP_HOST || 'NOT SET', smtpPort: process.env.SMTP_PORT || 'NOT SET', smtpUser: process.env.SMTP_USER || process.env.SMTP_FROM || 'NOT SET', fromEmail: process.env.SMTP_FROM || process.env.SMTP_USER || 'NOT SET', toEmail: process.env.SMTP_TO || process.env.SMTP_USER || 'NOT SET' } : undefined }, { status: 500 })
  }
}
