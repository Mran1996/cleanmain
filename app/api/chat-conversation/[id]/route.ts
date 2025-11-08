import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// GET /api/chat-conversation/[id] - Get a specific conversation with all its messages
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversationId = params.id;

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
    }

    // Use the helper function to get conversation with messages
    const { data: result, error } = await supabase
      .rpc('get_conversation_with_messages', {
        p_conversation_id: conversationId,
        p_user_id: user.id
      });

    if (error) {
      console.error('Error fetching conversation:', error);
      return NextResponse.json({ error: 'Failed to fetch conversation' }, { status: 500 });
    }

    if (!result || result.length === 0) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const conversation = result[0];
    
    // Format the response
    return NextResponse.json({
      conversation: {
        id: conversation.id,
        title: conversation.title,
        legal_category: conversation.legal_category,
        status: conversation.status,
        metadata: conversation.metadata,
        created_at: conversation.created_at,
        updated_at: conversation.updated_at,
        messages: conversation.messages || []
      }
    });
  } catch (error) {
    console.error('Error in GET /api/chat-conversation/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/chat-conversation/[id] - Update a conversation
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversationId = params.id;
    const { title, legal_category, metadata } = await req.json();

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
    }

    // Build update object with only provided fields
    const updateData: any = { updated_at: new Date().toISOString() };
    if (title !== undefined) updateData.title = title;
    if (legal_category !== undefined) updateData.legal_category = legal_category;
    if (metadata !== undefined) updateData.metadata = metadata;

    // Update the conversation
    const { data: conversation, error } = await supabase
      .from('chat_conversations')
      .update(updateData)
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating conversation:', error);
      return NextResponse.json({ error: 'Failed to update conversation' }, { status: 500 });
    }

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error('Error in PUT /api/chat-conversation/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}