import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { retrieveMemories } from '@/lib/pinecone-memory';

/**
 * Retrieve relevant memories from Pinecone
 * GET /api/user-memory/retrieve-pinecone?query=...
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
    const limit = parseInt(searchParams.get('limit') || '5');
    const minScore = parseFloat(searchParams.get('minScore') || '0.7');
    const memoryTypesParam = searchParams.get('memoryTypes');

    if (!query) {
      return NextResponse.json({ error: 'Query parameter required' }, { status: 400 });
    }

    const memoryTypes = memoryTypesParam ? memoryTypesParam.split(',') : undefined;

    const memories = await retrieveMemories(user.id, query, {
      limit,
      minScore,
      memoryTypes,
    });

    return NextResponse.json({
      success: true,
      memories,
      count: memories.length,
    });

  } catch (error: any) {
    console.error('Error retrieving memories:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve memories', details: error.message },
      { status: 500 }
    );
  }
}


