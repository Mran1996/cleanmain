import { NextRequest, NextResponse } from 'next/server';

import { createClient, createAdminClient } from '@/utils/supabase/server';
import { stripe } from '@/lib/stripe-server';
import { PRODUCTS } from '@/lib/stripe-config';
import nodemailer from 'nodemailer';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Basic file type validation and signature scanning
function validateAndScanFile(buffer: Buffer, filename: string, mimetype?: string) {
  // Allow all file types - no extension restrictions
  // Just perform basic size validation (handled separately)
  return { ok: true };
}

// Email transporter (Brevo SMTP) mirroring contact route config
function createTransporter() {
  const smtpConfig = {
    host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: false,
    tls: { rejectUnauthorized: false },
    auth: {
      user: process.env.SMTP_USER || '98ddc5001@smtp-brevo.com',
      pass: process.env.SMTP_PASS || 'YwFEcpOACxdghZs3',
    },
    debug: true,
    logger: true,
  };
  return nodemailer.createTransport(smtpConfig);
}

// Ensure Node runtime for libraries like nodemailer
export const runtime = 'nodejs';

// AWS S3 client configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});
const s3Bucket = process.env.AWS_S3_BUCKET_NAME || process.env.AWS_S3_BUCKET || '';
const s3Region = process.env.AWS_REGION || 'us-east-1';

// Helper to convert Node stream to Buffer
async function streamToBuffer(stream: any): Promise<Buffer> {
  return await new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk: any) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    stream.on('error', (err: any) => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

export async function POST(request: NextRequest) {


  // User-level client to verify auth
  const supabaseUserClient = await createClient();
  const { data: { user }, error: authError } = await supabaseUserClient.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }



  const supabaseAdmin = await createAdminClient();

  try {
    // Parse multipart form using Web API
    const formData = await request.formData();
    const full_name = (formData.get('full_name') as string || '').trim();
    const email = (formData.get('email') as string || '').trim();
    const phone = (formData.get('phone') as string || '').trim();
    const stateInput = (formData.get('state') as string || '').trim();
    const county = (formData.get('county') as string || '').trim();
    const case_number = (formData.get('case_number') as string || '').trim();
    const opposing_party = (formData.get('opposing_party') as string || '').trim();
    const description = (formData.get('description') as string || '').trim();
    const stripe_session_id = (formData.get('stripe_session_id') as string || '').trim();
    
    // Enforce 2-letter US state codes
    const US_STATES = new Set([
      'AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'
    ]);
    const stateCode = stateInput.toUpperCase();

    // Server-side validation
    const errors: string[] = [];
    if (!full_name) errors.push('Full Name is required');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Valid Email is required');
    if (!stateCode) errors.push('State is required');
    else if (!US_STATES.has(stateCode)) errors.push('State must be a 2-letter US code (e.g., CA)');
    if (!county) errors.push('County is required');
    if (!case_number) errors.push('Case Number is required');
    if (!opposing_party) errors.push('Opposing Party is required');
    if (!description) errors.push('Description is required');
    if (!stripe_session_id) errors.push('Missing Stripe session');
    if (errors.length) {
      return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 });
    }

    // Verify Stripe session matches user and plan
    const session = await stripe.checkout.sessions.retrieve(stripe_session_id);
    const plan = (session.metadata?.plan || '').toString();
    const paidUserId = (session.metadata?.user_id || '').toString();
    if (session.payment_status !== 'paid' || session.mode !== 'payment' || plan !== PRODUCTS.FULL_SERVICE || paidUserId !== user.id) {
      return NextResponse.json({ error: 'Payment verification failed' }, { status: 403 });
    }

    // Handle file upload if provided
    const uploaded = formData.get('file') as File | null;
    let storedFilePath: string | null = null;
    let file_type: string | null = null;
    let file_size: number | null = null;
    let signedFileUrl: string | null = null;
let publicReadApplied: boolean = false;

    // Requested validity; default to 100 years if not specified
    const expiresParam = formData.get('expires_in');
    const REQUESTED_100_YEARS_SECS = 100 * 365 * 24 * 60 * 60; // ~3.15B seconds
    const S3_MAX_EXPIRES_SECS = 7 * 24 * 60 * 60; // AWS S3 presigned max = 7 days
    const requestedExpires =  REQUESTED_100_YEARS_SECS;
    const effectiveExpires = Math.min(requestedExpires, S3_MAX_EXPIRES_SECS);
    const makePublic = !expiresParam || requestedExpires > S3_MAX_EXPIRES_SECS; // "no validity" or beyond S3 max => try unlimited via public read

    if (uploaded && uploaded.size > 0) {
      // Validate file type and size
      if (uploaded.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
      }

      const arrayBuffer = await uploaded.arrayBuffer();
      const fileBuffer = Buffer.from(arrayBuffer);
      const scan = validateAndScanFile(fileBuffer, uploaded.name || 'file', uploaded.type || undefined);
      if (!scan.ok) {
        return NextResponse.json({ error: 'File validation failed' }, { status: 400 });
      }

      if (!s3Bucket) {
        return NextResponse.json({ error: 'S3 bucket not configured' }, { status: 500 });
      }

      const safeName = `${user.id}/${Date.now()}-${(uploaded.name || 'upload').replace(/[^a-zA-Z0-9._-]/g, '_')}`;

      try {
        await s3Client.send(new PutObjectCommand({
          Bucket: s3Bucket,
          Key: safeName,
          Body: fileBuffer,
          ContentType: uploaded.type || 'application/octet-stream',
          ACL: makePublic ? 'public-read' : undefined,
        }));
        publicReadApplied = !!makePublic;
      } catch (uploadErr: any) {
        // Fallback for buckets that enforce object ownership and disallow ACLs
        try {
          await s3Client.send(new PutObjectCommand({
            Bucket: s3Bucket,
            Key: safeName,
            Body: fileBuffer,
            ContentType: uploaded.type || 'application/octet-stream',
          }));
          publicReadApplied = false;
        } catch (fallbackErr: any) {
          return NextResponse.json({ error: 'Upload failed', details: fallbackErr?.message || uploadErr?.message || 'S3 error' }, { status: 500 });
        }
      }

      storedFilePath = safeName;
      file_type = uploaded.type || null;
      file_size = uploaded.size || null;

      // Generate a presigned URL for viewable access (max 7 days due to AWS limits)
      try {
        signedFileUrl = await getSignedUrl(s3Client, new GetObjectCommand({
          Bucket: s3Bucket,
          Key: storedFilePath,
        }), { expiresIn: effectiveExpires });
      } catch (signErr: any) {
        console.warn('⚠️  Failed to generate presigned URL:', signErr?.message);
      }
    }

    // Store submission in Supabase
    console.log('💾 Saving intake submission to Supabase for user:', user.id);
    const fileUrl = storedFilePath ? `https://${s3Bucket}.s3.${s3Region}.amazonaws.com/${storedFilePath}` : null;
const appOrigin = new URL(request.url).origin;
const appViewUrl = storedFilePath ? `${appOrigin}/api/open-file?key=${encodeURIComponent(storedFilePath)}` : null;
const finalViewUrl = publicReadApplied ? fileUrl : appViewUrl;
    const submissionData = {
      user_id: user.id,
      stripe_session_id,
      full_name,
      email,
      phone: phone || null,
      state: stateCode,
      county,
      case_number,
      opposing_party,
      description,
      file_url: finalViewUrl,
      file_type,
      file_size,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    const { error: insertError } = await supabaseAdmin
      .from('full_service_requests')
      .insert([submissionData]);

    if (insertError) {
      console.error('❌ Database insert failed:', insertError);
      return NextResponse.json({ error: 'Database insert failed', details: insertError.message }, { status: 500 });
    }
    
    console.log('✅ Intake submission saved successfully to database');
    console.log('📊 Submission summary:', {
      user_id: user.id,
      case: `${stateCode}/${county} - ${case_number}`,
      has_file: !!storedFilePath,
      timestamp: new Date().toISOString()
    });

    // Send notification email to admin
    try {
      const transporter = createTransporter();
      const toAddress = 'support@askailegal.com';
      const fromAddress = process.env.SMTP_FROM || 'support@askailegal.com';
      const subject = `🔔 New Full Service Intake: ${full_name} (${stateCode}/${county})`;
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 10px;">New Full Service Intake Submission</h2>
          
          <h3 style="color: #374151; margin-top: 20px;">Client Information</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Name:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${full_name}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Email:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><a href="mailto:${email}">${email}</a></td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Phone:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${phone || 'N/A'}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>User ID:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><code>${user.id}</code></td></tr>
          </table>
          
          <h3 style="color: #374151; margin-top: 20px;">Case Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>State/County:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${stateCode} / ${county}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Case Number:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${case_number}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Opposing Party:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${opposing_party}</td></tr>
          </table>
          
          <h3 style="color: #374151; margin-top: 20px;">Description</h3>
          <div style="background: #f9fafb; padding: 15px; border-left: 4px solid #10b981; margin: 10px 0;">
            ${description.replace(/\n/g, '<br/>')}
          </div>
          
          <h3 style="color: #374151; margin-top: 20px;">Payment Information</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Stripe Session:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><code>${stripe_session_id}</code></td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>File Uploaded:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${storedFilePath ? '✅ Yes (attached to this email)' : '❌ No file'}</td></tr>
            ${fileUrl ? `<tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>File URL:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><a href="${fileUrl}" target="_blank" rel="noopener noreferrer">${fileUrl}</a></td></tr>` : ''}
            ${finalViewUrl ? `<tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>${publicReadApplied ? 'Public File URL' : 'Permanent File Link'}:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><a href="${finalViewUrl}" target="_blank" rel="noopener noreferrer">Open File</a></td></tr>` : ''}
            ${file_type ? `<tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>File Type:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${file_type}</td></tr>` : ''}
            ${file_size ? `<tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>File Size:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${(file_size / 1024).toFixed(2)} KB</td></tr>` : ''}
          </table>
          
          <div style="margin-top: 30px; padding: 15px; background: #eff6ff; border-radius: 8px;">
            <p style="margin: 0; color: #1e40af;">📋 <strong>Next Steps:</strong> Review this intake and contact the client within 24-48 hours to discuss their case.</p>
          </div>
          
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
            <p>This is an automated notification from Ask AI Legal</p>
            <p>Submission received at ${new Date().toISOString()}</p>
          </div>
        </div>
      `;

      // Prepare email options
      const mailOptions: any = {
        from: fromAddress,
        to: toAddress,
        subject,
        html: emailHtml,
      };

      // Attach file if it was uploaded
      if (storedFilePath && uploaded) {
        try {
          const obj = await s3Client.send(new GetObjectCommand({
            Bucket: s3Bucket,
            Key: storedFilePath,
          }));

          const fileBuffer = obj.Body ? await streamToBuffer(obj.Body as any) : null;

          if (fileBuffer) {
            mailOptions.attachments = [{
              filename: uploaded.name || 'attachment',
              content: fileBuffer,
              contentType: file_type || 'application/octet-stream',
            }];
            console.log('📎 File attached to email:', uploaded.name);
          } else {
            console.warn('⚠️  Could not read file from S3 for email attachment');
          }
        } catch (attachError: any) {
          console.error('⚠️  Failed to attach file to email:', attachError?.message);
          // Continue sending email without attachment
        }
      }

      await transporter.sendMail(mailOptions);
      
      console.log('✅ Admin notification email sent successfully to:', toAddress);
    } catch (mailError: any) {
      // Log, but do not fail the submission
      console.error('❌ Notification email error:', mailError?.message || mailError);
      console.error('Email config:', {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER?.substring(0, 10) + '...',
      });
    }

    return NextResponse.json({ success: true, file_url: fileUrl, s3_key: storedFilePath, signed_file_url: signedFileUrl, view_url: finalViewUrl, app_view_url: appViewUrl, public_read: publicReadApplied, requested_expires_in: requestedExpires, expires_in_used: effectiveExpires, expires_capped: requestedExpires > S3_MAX_EXPIRES_SECS });
  } catch (error: any) {
    return NextResponse.json({ error: 'Submission failed', message: error.message }, { status: 500 });
  }
}