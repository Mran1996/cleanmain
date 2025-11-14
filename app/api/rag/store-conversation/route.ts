import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { storeConversationMemory, extractAndStoreLearnings } from '@/lib/rag-system';

/**
 * Store conversation in Pinecone and extract learnings
 * POST /api/rag/store-conversation
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
      userMessage,
      assistantResponse,
      conversationId,
      extractedFacts,
      preferences,
      conversationText,
      metadata,
    } = body;

    if (!userMessage || !assistantResponse) {
      return NextResponse.json(
        { error: 'userMessage and assistantResponse are required' },
        { status: 400 }
      );
    }

    // Store conversation memory
    await storeConversationMemory(user.id, {
      userMessage,
      assistantResponse,
      extractedFacts,
      preferences,
    });

    // Extract and store learnings if full conversation text provided
    let learningsStored = 0;
    if (conversationText) {
      const learningIds = await extractAndStoreLearnings(user.id, conversationText, {
        conversationId,
        ...metadata,
      });
      learningsStored = learningIds.length;
    }

    return NextResponse.json({
      success: true,
      message: 'Conversation stored successfully',
      learningsStored,
    });

  } catch (error: any) {
    console.error('Error storing conversation:', error);
    return NextResponse.json(
      { error: 'Failed to store conversation', details: error.message },
      { status: 500 }
    );
  }
}
