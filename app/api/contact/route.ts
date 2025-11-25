import { NextRequest, NextResponse } from 'next/server'

// Get Azure AD access token using client credentials flow
async function getAzureAccessToken(): Promise<string> {
  const tenantId = process.env.AZURE_TENANT_ID
  const clientId = process.env.AZURE_CLIENT_ID
  const clientSecret = process.env.AZURE_CLIENT_SECRET

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error('Azure AD credentials are missing. Please set AZURE_TENANT_ID, AZURE_CLIENT_ID, and AZURE_CLIENT_SECRET in .env.local')
  }

  const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`
  
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials'
  })

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to get Azure AD access token: ${response.status} ${errorText}`)
  }

  const data = await response.json()
  return data.access_token
}

// Send email using Microsoft Graph API
async function sendEmailViaGraph(
  accessToken: string,
  to: string,
  subject: string,
  htmlContent: string,
  attachments?: Array<{ name: string; content: string; contentType: string }>
) {
  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || 'support@askailegal.com'
  
  // Build message payload
  const message: any = {
    message: {
      subject: subject,
      body: {
        contentType: 'HTML',
        content: htmlContent
      },
      toRecipients: [
        {
          emailAddress: {
            address: to
          }
        }
      ],
      from: {
        emailAddress: {
          address: fromEmail
        }
      }
    }
  }

  // Add attachments if provided
  if (attachments && attachments.length > 0) {
    message.message.attachments = attachments.map(att => ({
      '@odata.type': '#microsoft.graph.fileAttachment',
      name: att.name,
      contentType: att.contentType,
      contentBytes: att.content
    }))
  }

  const graphEndpoint = `https://graph.microsoft.com/v1.0/users/${fromEmail}/sendMail`

  const response = await fetch(graphEndpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(message)
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to send email via Microsoft Graph: ${response.status} ${errorText}`)
  }

  return { messageId: `graph-${Date.now()}` }
}

// In-memory cache to prevent duplicate submissions (clears after 60 seconds)
const recentSubmissions = new Map<string, number>()

// Clean up old entries every 30 seconds
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    let cleaned = 0
    for (const [key, timestamp] of recentSubmissions.entries()) {
      if (now - timestamp > 60000) { // Keep entries for 60 seconds
        recentSubmissions.delete(key)
        cleaned++
      }
    }
    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} old submission entries`)
    }
  }, 30000) // Run cleanup every 30 seconds
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const name = (formData.get('name') as string)?.trim() || ''
    const email = (formData.get('email') as string)?.trim() || ''
    const reason = (formData.get('reason') as string)?.trim() || ''
    const message = (formData.get('message') as string)?.trim() || ''
    const file = formData.get('file') as File | null

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Create a unique key for this submission (email + message hash)
    // Use a more robust hash that includes the full message content
    const messageHash = Buffer.from(message.trim().toLowerCase()).toString('base64').substring(0, 32)
    const submissionKey = `${email.toLowerCase().trim()}-${messageHash}`
    
    // Check if this is a duplicate submission within the last 30 seconds (increased from 5)
    const now = Date.now()
    const existingTimestamp = recentSubmissions.get(submissionKey)
    if (existingTimestamp && now - existingTimestamp < 30000) {
      console.log('❌ Duplicate submission detected on server side (within 30s), ignoring')
      console.log(`   Email: ${email}, Time since last: ${now - existingTimestamp}ms`)
      return NextResponse.json(
        { error: 'Duplicate submission detected. Please wait a moment before submitting again.' },
        { status: 429 }
      )
    }
    
    // Record this submission (overwrite if exists)
    recentSubmissions.set(submissionKey, now)

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

    const toEmail = process.env.SMTP_TO || process.env.SMTP_USER || 'support@askailegal.com'
    const subject = `Contact Form: ${reason} - ${name}`

    // Prepare attachments if file is provided
    let attachments: Array<{ name: string; content: string; contentType: string }> | undefined
    if (file && file.size > 0) {
      const fileBuffer = await file.arrayBuffer()
      const fileBase64 = Buffer.from(fileBuffer).toString('base64')
      attachments = [{
        name: file.name,
        content: fileBase64,
        contentType: file.type || 'application/octet-stream'
      }]
      emailContent += `
        <p><strong>File Attached:</strong> ${escapeHtml(file.name)}</p>
        <p><strong>File Size:</strong> ${(file.size / 1024).toFixed(2)} KB</p>
      `
    }

    // Get Azure AD access token and send email via Microsoft Graph API
    try {
      const accessToken = await getAzureAccessToken()
      const info = await sendEmailViaGraph(accessToken, toEmail, subject, emailContent, attachments)
      
      console.log('✅ Message sent successfully via Microsoft Graph API: %s', info.messageId);
      console.log(`   Submission key: ${submissionKey}`);
      console.log(`   Total recent submissions tracked: ${recentSubmissions.size}`);

      return NextResponse.json({ 
        success: true,
        messageId: info.messageId 
      })
    } catch (emailError: any) {
      // In development mode, allow form submission even if email fails
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Email sending failed in development mode, but allowing submission:', emailError.message);
        console.log('📧 Form submission details:');
        console.log(`   Name: ${name}`);
        console.log(`   Email: ${email}`);
        console.log(`   Reason: ${reason || 'Not specified'}`);
        console.log(`   Message: ${message.substring(0, 100)}...`);
        
        return NextResponse.json({ 
          success: true,
          messageId: `dev-${Date.now()}`,
          warning: 'Email sending failed in development mode. Form submission was recorded.'
        })
      }
      // In production, re-throw the error
      throw emailError
    }
  } catch (error: any) {
    console.error('Contact form error:', error)
    
    // Provide more helpful error messages for common issues
    let errorMessage = error?.message || 'Failed to send message'
    let errorCode = error?.code || 'UNKNOWN_ERROR'
    
    // Handle Azure AD authentication errors
    if (errorMessage.includes('Azure AD credentials are missing') || errorMessage.includes('Failed to get Azure AD access token')) {
      errorMessage = 'Azure AD authentication failed. Please verify your Azure AD credentials in .env.local (AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET).'
      errorCode = 'AUTH_ERROR'
    }
    
    // Handle Microsoft Graph API errors
    if (errorMessage.includes('Failed to send email via Microsoft Graph')) {
      if (errorMessage.includes('401') || errorMessage.includes('403')) {
        errorMessage = 'Microsoft Graph API authentication failed. Please verify your Azure AD credentials and ensure the application has "Mail.Send" permission.'
        errorCode = 'GRAPH_AUTH_ERROR'
      } else if (errorMessage.includes('404')) {
        errorMessage = 'Email address not found in Microsoft Graph. Please verify SMTP_FROM/SMTP_USER is a valid email address in your Azure AD tenant.'
        errorCode = 'GRAPH_NOT_FOUND'
      } else {
        errorMessage = `Microsoft Graph API error: ${errorMessage}`
        errorCode = 'GRAPH_ERROR'
      }
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        code: errorCode,
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
        troubleshooting: process.env.NODE_ENV === 'development' ? {
          hasAzureCredentials: !!(process.env.AZURE_TENANT_ID && process.env.AZURE_CLIENT_ID && process.env.AZURE_CLIENT_SECRET),
          fromEmail: process.env.SMTP_FROM || process.env.SMTP_USER || 'NOT SET',
          toEmail: process.env.SMTP_TO || process.env.SMTP_USER || 'NOT SET',
          azureTenantId: process.env.AZURE_TENANT_ID ? 'SET' : 'NOT SET',
          azureClientId: process.env.AZURE_CLIENT_ID ? 'SET' : 'NOT SET'
        } : undefined
      },
      { status: 500 }
    )
  }
}
