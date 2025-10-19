import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
// Use Web-standard FormData parsing via NextRequest.formData()
import { stripe } from '@/lib/stripe-server';
import { PRODUCTS } from '@/lib/stripe-config';
import nodemailer from 'nodemailer';

// Basic file type validation and signature scanning
function validateAndScanFile(buffer: Buffer, filename: string, mimetype?: string) {
  const ext = (filename.split('.').pop() || '').toLowerCase();
  const allowedExts = ['pdf', 'docx', 'jpg', 'jpeg'];
  const allowedMime = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg'];

  if (!allowedExts.includes(ext)) return { ok: false, reason: 'Invalid file extension' };
  if (mimetype && !allowedMime.includes(mimetype)) return { ok: false, reason: 'Invalid MIME type' };

  // Magic bytes signatures
  const sigPDF = buffer.slice(0, 5).toString('ascii'); // %PDF-
  const sigZIP = buffer.slice(0, 4).toString('ascii'); // PK\x03\x04 for docx
  const sigJPEG = buffer.slice(0, 3);

  if (ext === 'pdf') {
    if (sigPDF !== '%PDF-') return { ok: false, reason: 'Invalid PDF signature' };
  } else if (ext === 'docx') {
    if (sigZIP !== 'PK\x03\x04' && sigZIP !== 'PK\x05\x06') return { ok: false, reason: 'Invalid DOCX signature' };
    // Minimal malware check: disallow potentially dangerous embedded macros by scanning for vbaProject
    // This is heuristic since parsing zip is heavy; we scan raw buffer for the marker
    const marker = Buffer.from('vbaProject.bin', 'ascii');
    if (buffer.includes(marker)) return { ok: false, reason: 'DOCX contains macros' };
  } else if (ext === 'jpg' || ext === 'jpeg') {
    if (!(sigJPEG[0] === 0xFF && sigJPEG[1] === 0xD8 && sigJPEG[2] === 0xFF)) return { ok: false, reason: 'Invalid JPEG signature' };
  }

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

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();

  // User-level client to verify auth
  const supabaseUserClient = await createClient();
  const { data: { user }, error: authError } = await supabaseUserClient.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Admin client for storage/db operations
  const supabaseAdmin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
        set(name: string, value: string, options: any) { cookieStore.set({ name, value, ...options }); },
        remove(name: string, options: any) { cookieStore.set({ name, value: '', ...options }); },
      },
    }
  );

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

    if (uploaded && uploaded.size > 0) {
      // Validate file type and size
      if (uploaded.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
      }

      const arrayBuffer = await uploaded.arrayBuffer();
      const fileBuffer = Buffer.from(arrayBuffer);
      const scan = validateAndScanFile(fileBuffer, uploaded.name || 'file', uploaded.type || undefined);
      if (!scan.ok) {
        return NextResponse.json({ error: `Invalid or unsafe file: ${scan.reason}` }, { status: 400 });
      }

      // Ensure bucket exists (private)
      try {
        await supabaseAdmin.storage.createBucket('full_service_uploads', { public: false });
      } catch (e) {
        // ignore if already exists
      }

      const safeName = `${user.id}-${Date.now()}-${(uploaded.name || 'upload').replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('full_service_uploads')
        .upload(safeName, fileBuffer, {
          contentType: uploaded.type || 'application/octet-stream',
          upsert: false,
        });

      if (uploadError) {
        return NextResponse.json({ error: 'Upload failed', details: uploadError.message }, { status: 500 });
      }

      storedFilePath = uploadData?.path || safeName;
      file_type = uploaded.type || null;
      file_size = uploaded.size || null;
    }

    // Store submission in Supabase
    console.log('💾 Saving intake submission to Supabase for user:', user.id);
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
      file_url: storedFilePath,
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
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>File Uploaded:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${storedFilePath ? '✅ Yes (stored in Supabase)' : '❌ No file'}</td></tr>
            ${storedFilePath ? `<tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>File Path:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><code>${storedFilePath}</code></td></tr>` : ''}
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

      await transporter.sendMail({
        from: fromAddress,
        to: toAddress,
        subject,
        html: emailHtml,
      });
      
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

    return NextResponse.json({ success: true, file_path: storedFilePath });
  } catch (error: any) {
    return NextResponse.json({ error: 'Submission failed', message: error.message }, { status: 500 });
  }
}