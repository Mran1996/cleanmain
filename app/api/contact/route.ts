import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

// Configure the email transporter for Outlook
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'outlook',
    auth: {
      user: process.env.OUTLOOK_EMAIL,
      pass: process.env.OUTLOOK_PASSWORD,
    },
  })
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
      from: process.env.OUTLOOK_EMAIL,
      to: 'support@askailegal.com',
      subject: `Contact Form: ${reason} - ${name}`,
      html: emailContent,
      attachments: file && file.size > 0 ? [{
        filename: file.name,
        content: Buffer.from(await file.arrayBuffer()),
      }] : [],
    }

    await transporter.sendMail(mailOptions)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
