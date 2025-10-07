import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  try {
    // Create Supabase client
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: "Not authenticated",
        details: authError?.message 
      }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    const { 
      title, 
      content, 
      document_type, 
      legal_category, 
      case_details = {},
      metadata = {} 
    } = body;

    // Validate required fields
    if (!title || !content) {
      return NextResponse.json({ 
        error: "Missing required fields: title and content are required" 
      }, { status: 400 });
    }

    // Prepare document data for the existing documents table structure
    const documentData = {
      user_id: user.id,
      filename: `${title.replace(/[^a-z0-9\s\-_]/gi, '_').replace(/\s+/g, '_')}.txt`,
      original_filename: `${title}.txt`,
      file_size: Buffer.byteLength(content, 'utf8'),
      file_type: 'text/plain',
      content,
      metadata: {
        ...metadata,
        document_type,
        legal_category,
        case_details,
        generated_by_ai: true,
        original_title: title,
        saved_at: new Date().toISOString()
      },
      // Extract legal document specific fields from case_details
      plaintiff: case_details?.plaintiff || null,
      defendant: case_details?.defendant || null,
      court: case_details?.court || null,
      case_number: case_details?.case_number || null,
      case_type: document_type || legal_category || null,
      filing_date: case_details?.filing_date ? new Date(case_details.filing_date) : null
    };

    // Insert the document into the existing documents table
    const { data: savedDocument, error: insertError } = await supabase
      .from('documents')
      .insert(documentData)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error saving document:', insertError);
      console.error('Document data:', JSON.stringify(documentData, null, 2));
      return NextResponse.json({ 
        error: "Failed to save document",
        details: insertError.message,
        code: insertError.code
      }, { status: 500 });
    }

    console.log('✅ Document saved successfully:', {
      id: savedDocument.id,
      title: savedDocument.metadata?.original_title,
      user_id: savedDocument.user_id
    });
    
    return NextResponse.json({ 
      success: true,
      message: "Document saved successfully",
      document: savedDocument
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Unexpected error in save-generated-document:', error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
