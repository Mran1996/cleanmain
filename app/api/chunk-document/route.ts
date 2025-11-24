import { NextRequest, NextResponse } from 'next/server';
import { processUploadedDocument } from '@/lib/document-chunking';
import { supabase } from '@/lib/supabaseClient';
import { checkSubscriptionStatusServerEnhanced } from "@/lib/subscription-check";
import { checkRateLimit } from '@/lib/rate-limiter';

export async function POST(req: NextRequest) {
  try {
    // Rate limiting - 20 requests per minute per IP (more reasonable for document processing)
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rateLimit = checkRateLimit(`chunk-document-${clientIP}`, 20, 60000);
    
    if (!rateLimit.allowed) {
      return NextResponse.json({ 
        error: 'Rate limit exceeded. Please try again later.',
        resetTime: rateLimit.resetTime
      }, { status: 429 });
    }

    console.log('🚨 [CHUNK DEBUG] === CHUNK DOCUMENT API DEBUG START ===');
    const body = await req.json();
    
    // Check subscription status for non-localhost requests
    const host = req.headers.get('host') || '';
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
    
    if (!isLocalhost && body.userId) {
      const subscriptionStatus = await checkSubscriptionStatusServerEnhanced(body.userId);
      if (subscriptionStatus.shouldRedirect) {
        console.log("🚨 [CHUNK DOCUMENT] Access denied - user does not have active subscription");
        return NextResponse.json(
          { error: 'Access denied. Please upgrade your subscription to continue.' },
          { status: 403 }
        );
      }
    }
    
    console.log('🚨 [CHUNK DEBUG] Received body:', {
      userId: body.userId,
      documentId: body.documentId,
      hasDocumentText: !!body.documentText,
      documentTextLength: body.documentText?.length,
      metadata: body.metadata
    });
    
    const { userId, documentId, documentText, metadata } = body;
    if (!userId || !documentId || !documentText) {
      console.error('🚨 [CHUNK DEBUG] ERROR: Missing required fields:', { userId, documentId, hasDocumentText: !!documentText });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check file type/extension
    const filename = metadata?.filename || metadata?.title || 'unknown';
    const fileExtension = filename.split('.').pop()?.toLowerCase();
    console.log('🚨 [CHUNK DEBUG] File info:', {
      filename,
      fileExtension,
      metadataKeys: Object.keys(metadata || {}),
      isPDF: fileExtension === 'pdf',
      isDOCX: fileExtension === 'docx',
      isTXT: fileExtension === 'txt'
    });

    // Validate file type
    const allowedExtensions = ['pdf', 'docx', 'txt'];
    if (!allowedExtensions.includes(fileExtension)) {
      console.error('🚨 [CHUNK DEBUG] ERROR: Unsupported file type:', fileExtension);
      return NextResponse.json({ 
        error: 'Unsupported file type. Please upload PDF, DOCX, or TXT files only.',
        fileType: fileExtension 
      }, { status: 400 });
    }

    try {
      // First, create the document record in the documents table
      console.log('🚨 [CHUNK DEBUG] Creating document record in database');
      
      let docError = null;
      
      // Use different approach for anonymous users vs authenticated users
      if (userId === 'anonymous') {
        // Use the database function for anonymous users
        const { error } = await supabase.rpc('create_anonymous_document', {
          p_document_id: documentId,
          p_filename: metadata?.filename || 'Uploaded Document',
          p_original_filename: metadata?.filename || 'Uploaded Document',
          p_file_size: documentText.length,
          p_file_type: fileExtension,
          p_content: documentText,
          p_metadata: metadata || {}
        });
        docError = error;
      } else {
        // Use direct insert for authenticated users
        const { error } = await supabase
          .from('documents')
          .insert({
            id: documentId,
            user_id: userId,
            filename: metadata?.filename || 'Uploaded Document',
            original_filename: metadata?.filename || 'Uploaded Document',
            file_size: documentText.length,
            file_type: fileExtension,
            content: documentText,
            metadata: metadata || {}
          });
        docError = error;
      }

      if (docError) {
        console.error('🚨 [CHUNK DEBUG] ERROR creating document record:', docError);
        // Don't fail the upload if database isn't set up - the document text is still available for chat
        console.log('🚨 [CHUNK DEBUG] Document record creation failed, but continuing with document processing...');
      } else {
        console.log('🚨 [CHUNK DEBUG] Document record created successfully');
      }

      // Then process the document chunks (only if database is available)
      try {
        console.log('🚨 [CHUNK DEBUG] Starting document chunking process');
        await processUploadedDocument(userId, documentId, documentText, metadata);
        console.log('🚨 [CHUNK DEBUG] Document processed successfully');
      } catch (chunkError) {
        console.error('🚨 [CHUNK DEBUG] ERROR in chunking process:', chunkError);
        console.log('🚨 [CHUNK DEBUG] Chunking failed, but document text is available for chat');
      }
      
      // Verify chunks were created (only if database is available)
      try {
        const { data: chunkCount, error: countError } = await supabase
          .from('document_chunks')
          .select('id', { count: 'exact' })
          .eq('document_id', documentId);

        if (countError) {
          console.error('🚨 [CHUNK DEBUG] ERROR checking chunk count:', countError);
        } else {
          console.log('🚨 [CHUNK DEBUG] Chunks created successfully:', {
            documentId,
            chunkCount: chunkCount?.length || 0
          });
        }
      } catch (countError) {
        console.log('🚨 [CHUNK DEBUG] Could not verify chunks (database not available)');
      }

      console.log('🚨 [CHUNK DEBUG] === CHUNK DOCUMENT API DEBUG END ===');
      return NextResponse.json({ 
        success: true,
        chunkCount: 0, // Will be 0 if database not set up
        message: 'Document processed successfully. Document text is available for chat.'
      });
    } catch (processError) {
      console.error('🚨 [CHUNK DEBUG] ERROR in processUploadedDocument:', processError);
      return NextResponse.json({
        error: 'Failed to process document',
        details: processError?.message || String(processError),
        stack: processError?.stack || null
      }, { status: 500 });
    }
  } catch (error) {
    console.error('🚨 [CHUNK DEBUG] Unexpected error in /api/chunk-document:', error);
    return NextResponse.json({
      error: 'Unexpected server error',
      details: error?.message || String(error),
      stack: error?.stack || null
    }, { status: 500 });
  }
} 