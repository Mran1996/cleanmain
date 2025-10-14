import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const docId = params.id;
    
    if (!docId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
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

    // Fetch document from Supabase
    const { data: document, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', docId)
      .single();

    if (error) {
      console.error('Error fetching document:', error);
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
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