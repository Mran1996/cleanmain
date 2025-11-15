import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getServerUser } from '@/utils/server-auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: docId } = await params;
    const body = await request.json();
    const { content } = body;
    
    if (!docId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    if (!content) {
      return NextResponse.json({ error: 'Document content is required' }, { status: 400 });
    }

    // SECURITY: Verify user is authenticated
    const { user, isAuthenticated } = await getServerUser();
    if (!isAuthenticated || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // SECURITY: Validate content size to prevent DoS
    const contentSize = Buffer.byteLength(content, 'utf8');
    const maxSize = 50 * 1024 * 1024; // 50MB limit
    if (contentSize > maxSize) {
      return NextResponse.json({ error: 'Document content too large (max 50MB)' }, { status: 400 });
    }

    // Create Supabase client with user authentication
    const supabase = await createClient();

    // SECURITY: First verify document exists and belongs to user
    const { data: existingDoc, error: fetchError } = await supabase
      .from('documents')
      .select('id, user_id')
      .eq('id', docId)
      .eq('user_id', user.id) // SECURITY: Verify ownership
      .single();

    if (fetchError || !existingDoc) {
      return NextResponse.json({ error: 'Document not found or unauthorized' }, { status: 404 });
    }

    // Update document content in Supabase
    const { data: document, error } = await supabase
      .from('documents')
      .update({ 
        content: content,
        file_size: contentSize,
        updated_at: new Date().toISOString()
      })
      .eq('id', docId)
      .eq('user_id', user.id) // SECURITY: Double-check ownership in update
      .select()
      .single();

    if (error) {
      console.error('Error updating document:', error);
      return NextResponse.json({ error: 'Failed to update document' }, { status: 500 });
    }

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Document updated successfully',
      document: {
        id: document.id,
        title: document.title,
        content: document.content,
        updated_at: document.updated_at
      }
    });

  } catch (error) {
    console.error('Error in update-document API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
