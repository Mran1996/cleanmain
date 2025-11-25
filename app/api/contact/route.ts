import { NextRequest, NextResponse } from 'next/server'
import * as nodemailer from 'nodemailer'
import type { SendMailOptions } from 'nodemailer'
import { supabase } from '../../../lib/supabaseClient'

const recentSubmissions = new Map<string, number>()

if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    const entries = Array.from(recentSubmissions.entries())
    for (const [key, ts] of entries) {
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

  const mailOptions: SendMailOptions = { from: fromEmail, to, subject, html: htmlContent }
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

    // Save to Supabase database
    let supabaseId: string | null = null
    try {
      console.log('📝 Attempting to save contact form to Supabase...')
      const submissionData = {
        name,
        email,
        reason: reason || 'General Inquiry',
        message,
        has_attachment: !!(file && file.size > 0),
        attachment_name: file?.name || null,
        attachment_size: file?.size || null,
        submission_ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        status: 'received'
      }
      console.log('📊 Submission data:', JSON.stringify(submissionData, null, 2))
      
      const { data, error } = await supabase
        .from('contact_submissions')
        .insert([submissionData])
        .select('id')
        .single()

      if (error) {
        console.error('❌ Supabase insertion error:', error)
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        })
        // Continue with email sending even if database save fails
      } else if (data) {
        supabaseId = data.id
        console.log('✅ Contact form saved to database with ID:', supabaseId)
      }
    } catch (dbError) {
      console.error('💥 Database save failed with exception:', dbError)
      if (dbError instanceof Error) {
        console.error('Error name:', dbError.name)
        console.error('Error message:', dbError.message)
        console.error('Error stack:', dbError.stack)
      }
      // Continue with email sending even if database save fails
    }

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

    const toEmail = process.env.SMTP_FROM || 'support@askailegal.com'
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
      const response = { 
        success: true, 
        messageId: info.messageId, 
        databaseId: supabaseId,
        databaseStatus: supabaseId ? 'saved' : 'failed',
        debug: {
          hasSupabaseId: !!supabaseId,
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing',
          supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'configured' : 'missing'
        }
      }
      console.log('📤 API Response:', JSON.stringify(response, null, 2))
      return NextResponse.json(response)
    } catch (emailError: unknown) {
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({ success: true, messageId: `dev-${Date.now()}`, databaseId: supabaseId, warning: 'Email sending failed in development mode. Form submission was recorded.' })
      }
      throw emailError
    }
  } catch (error: unknown) {
    let errorMessage = 'Failed to send message'
    let errorCode = 'UNKNOWN_ERROR'
    
    if (error instanceof Error) {
      errorMessage = error.message
      if (error.message.includes('SMTP configuration')) { 
        errorMessage = 'SMTP configuration error. Please verify SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env.local.'; 
        errorCode = 'SMTP_CONFIG_ERROR' 
      }
      if (error.message.includes('Invalid login') || error.message.includes('AUTH')) { 
        errorMessage = 'SMTP authentication failed. Please verify Brevo SMTP username and key.'; 
        errorCode = 'SMTP_AUTH_ERROR' 
      }
      if (error.message.includes('getaddrinfo') || error.message.includes('ECONNREFUSED') || error.message.includes('ETIMEDOUT')) { 
        errorMessage = 'SMTP connection error. Please verify host, port, and network connectivity.'; 
        errorCode = 'SMTP_CONNECTION_ERROR' 
      }
    }
    return NextResponse.json({ error: errorMessage, code: errorCode, details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined, troubleshooting: process.env.NODE_ENV === 'development' ? { smtpHost: process.env.SMTP_HOST || 'NOT SET', smtpPort: process.env.SMTP_PORT || 'NOT SET', smtpUser: process.env.SMTP_USER || process.env.SMTP_FROM || 'NOT SET', fromEmail: process.env.SMTP_FROM || process.env.SMTP_USER || 'NOT SET', toEmail: process.env.SMTP_TO || process.env.SMTP_USER || 'NOT SET' } : undefined }, { status: 500 })
  }
}
