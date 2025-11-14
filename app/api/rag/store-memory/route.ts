import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { storeUserMemory } from '@/lib/pinecone-memory';

/**
 * Store User Memory Endpoint
 * POST /api/rag/store-memory
 * 
 * Stores a memory in Pinecone with user-specific namespace
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
      memoryType,
      category,
      keyText,
      valueText,
      context,
      confidenceScore,
      source,
    } = body;

    if (!memoryType || !keyText) {
      return NextResponse.json(
        { error: 'memoryType and keyText are required' },
        { status: 400 }
      );
    }

    // Store memory in Pinecone
    const memoryId = await storeUserMemory(user.id, {
      memoryType,
      category,
      keyText,
      valueText,
      context,
      confidenceScore,
      source,
    });

    return NextResponse.json({
      success: true,
      memoryId,
      message: 'Memory stored successfully',
    });

  } catch (error) {
    console.error('Error storing memory:', error);
    return NextResponse.json(
      {
        error: 'Failed to store memory',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

