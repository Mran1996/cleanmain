import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { retrieveContextForRAG } from '@/lib/rag-system';

/**
 * Get RAG context for a user query
 * POST /api/rag/context
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      query,
      limit = 5,
      minScore = 0.7,
      memoryTypes = [],
      includeConversationHistory = true,
    } = body;

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const ragContext = await retrieveContextForRAG(user.id, query, {
      limit,
      minScore,
      memoryTypes,
      includeConversationHistory,
    });

    return NextResponse.json({
      success: true,
      context: ragContext,
    });

  } catch (error: any) {
    console.error('Error retrieving RAG context:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve RAG context', details: error.message },
      { status: 500 }
    );
  }
}


