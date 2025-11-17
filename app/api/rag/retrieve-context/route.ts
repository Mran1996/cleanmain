import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { retrieveContextForRAG } from '@/lib/rag-system';

/**
 * RAG Context Retrieval Endpoint
 * GET /api/rag/retrieve-context?query=...&userId=...
 * 
 * Retrieves relevant user context from Pinecone for RAG
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query') || '';
    const memoryLimit = parseInt(searchParams.get('memoryLimit') || '5');
    const conversationLimit = parseInt(searchParams.get('conversationLimit') || '3');
    const minScore = parseFloat(searchParams.get('minScore') || '0.7');
    const memoryTypes = searchParams.get('memoryTypes')?.split(',') || undefined;

    if (!query) {
      return NextResponse.json({ error: 'Query parameter required' }, { status: 400 });
    }

    // Retrieve context from Pinecone
    const context = await retrieveContextForRAG(user.id, query, {
      limit: memoryLimit,
      minScore,
      memoryTypes: memoryTypes as any,
      includeConversationHistory: conversationLimit > 0,
    });

    return NextResponse.json({
      success: true,
      context,
      query,
      userId: user.id,
    });

  } catch (error) {
    console.error('Error retrieving RAG context:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve context',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

