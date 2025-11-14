import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// GET /api/chat-conversations - Get all conversations for the user
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all chat conversations for the user with message count
    const { data: conversations, error } = await supabase
      .from('chat_conversations')
      .select(`
        *,
        message_count:chat_messages(count)
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Error in GET /api/chat-conversations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/chat-conversations - Create a new conversation
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, legal_category = 'general', metadata = {} } = await req.json();

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Create the conversation
    const { data: conversation, error } = await supabase
      .from('chat_conversations')
      .insert({
        user_id: user.id,
        title,
        legal_category,
        metadata,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving conversation:', error);
      return NextResponse.json({ error: 'Failed to save conversation' }, { status: 500 });
    }

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error('Error in POST /api/chat-conversations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/chat-conversations - Delete a conversation
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('id');

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
    }

    // Soft delete the conversation (set status to deleted)
    const { error } = await supabase
      .from('chat_conversations')
      .update({ status: 'deleted' })
      .eq('id', conversationId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting conversation:', error);
      return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/chat-conversations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}












