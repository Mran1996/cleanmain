import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { storeMemory, UserMemory } from '@/lib/pinecone-memory';

/**
 * Store a memory in Pinecone
 * POST /api/user-memory/store
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
      frequency,
      metadata,
    } = body;

    if (!keyText) {
      return NextResponse.json({ error: 'keyText is required' }, { status: 400 });
    }

    const memory: UserMemory = {
      memoryType: memoryType || 'fact',
      category,
      keyText,
      valueText,
      context,
      confidenceScore: confidenceScore || 1.0,
      source: source || 'chat',
      frequency: frequency || 1,
      metadata,
    };

    const memoryId = await storeMemory(user.id, memory);

    return NextResponse.json({
      success: true,
      memoryId,
      message: 'Memory stored successfully',
    });

  } catch (error: any) {
    console.error('Error storing memory:', error);
    return NextResponse.json(
      { error: 'Failed to store memory', details: error.message },
      { status: 500 }
    );
  }
}


