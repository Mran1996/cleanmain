import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getServerUser } from '@/utils/server-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: docId } = await params;
    
    if (!docId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    // SECURITY: Verify user is authenticated
    const { user, isAuthenticated } = await getServerUser();
    if (!isAuthenticated || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create Supabase client with user authentication
    const supabase = await createClient();

    // Fetch document from Supabase - RLS will enforce user ownership
    const { data: document, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', docId)
      .eq('user_id', user.id) // SECURITY: Verify document belongs to user
      .single();

    if (error) {
      console.error('Error fetching document:', error);
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // SECURITY: Double-check ownership before returning
    if (document.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({
      id: document.id,
      title: document.title,
      content: document.content,
      metadata: document.metadata,
      created_at: document.created_at
    });

  } catch (error) {
    console.error('Error in get-document API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}