import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import formidable from 'formidable';
import { promises as fs } from 'fs';
import path from 'path';

// Configure the email transporter for Outlook
const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.OUTLOOK_EMAIL, // Your Outlook business email
      pass: process.env.OUTLOOK_PASSWORD, // Your Outlook password or app password
    },
    tls: {
      ciphers: 'SSLv3'
    }
  });
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Extract form fields
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const reason = formData.get('reason') as string;
    const message = formData.get('message') as string;
    const file = formData.get('file') as File | null;

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      );
    }

    // Create email transporter
    const transporter = createTransporter();

    // Prepare email content
    let emailContent = `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Reason:</strong> ${reason || 'Not specified'}</p>
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, '<br>')}</p>
    `;

    // Handle file attachment if present
    let attachments = [];
    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      attachments.push({
        filename: file.name,
        content: buffer,
        contentType: file.type || 'application/octet-stream'
      });

      emailContent += `<p><strong>Attached File:</strong> ${file.name} (${(file.size / 1024).toFixed(2)} KB)</p>`;
    }

    // Email options
    const mailOptions = {
      from: process.env.OUTLOOK_EMAIL,
      to: process.env.OUTLOOK_EMAIL, // Send to yourself
      replyTo: email, // Set reply-to as the customer's email
      subject: `Contact Form: ${reason || 'General Inquiry'} - ${name}`,
      html: emailContent,
      attachments: attachments
    };

    // Send email
    await transporter.sendMail(mailOptions);

    return NextResponse.json(
      { message: 'Message sent successfully!' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error sending contact form:', error);
    return NextResponse.json(
      { error: 'Failed to send message. Please try again.' },
      { status: 500 }
    );
  }
}
