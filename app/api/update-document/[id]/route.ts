import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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

    // Create Supabase client
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: "", ...options });
          },
        },
      }
    );

    // Update document content in Supabase
    const { data: document, error } = await supabase
      .from('documents')
      .update({ 
        content: content,
        file_size: Buffer.byteLength(content, 'utf8'),
        updated_at: new Date().toISOString()
      })
      .eq('id', docId)
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
