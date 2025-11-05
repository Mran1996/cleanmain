import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all chat conversations for the user
    const { data: conversations, error } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

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

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, messages, legal_category = 'general' } = await req.json();

    if (!title || !messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid data provided' }, { status: 400 });
    }

    // Save the conversation to database
    const { data: conversation, error } = await supabase
      .from('chat_conversations')
      .insert({
        user_id: user.id,
        title,
        messages: JSON.stringify(messages),
        legal_category,
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

    // Delete the conversation
    const { error } = await supabase
      .from('chat_conversations')
      .delete()
      .eq('id', conversationId)
      .eq('user_id', user.id); // Ensure user can only delete their own conversations

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





