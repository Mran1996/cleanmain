import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// GET /api/chat-messages - Get messages for a specific conversation
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
    }

    // Verify the conversation belongs to the user
    const { data: conversation, error: convError } = await supabase
      .from('chat_conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found or access denied' }, { status: 404 });
    }

    // Get all messages for the conversation
    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error in GET /api/chat-messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/chat-messages - Create a new message
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId, sender, content, messageType = 'text', metadata = {} } = await req.json();

    if (!conversationId || !sender || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify the conversation belongs to the user
    const { data: conversation, error: convError } = await supabase
      .from('chat_conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found or access denied' }, { status: 404 });
    }

    // Use the helper function to insert message and update conversation timestamp
    const { data: messageId, error } = await supabase
      .rpc('insert_message_update_conversation', {
        p_conversation_id: conversationId,
        p_sender: sender,
        p_content: content,
        p_message_type: messageType,
        p_metadata: metadata
      });

    if (error) {
      console.error('Error creating message:', error);
      return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
    }

    // Get the created message
    const { data: message, error: fetchError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('id', messageId)
      .single();

    if (fetchError) {
      console.error('Error fetching created message:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch created message' }, { status: 500 });
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Error in POST /api/chat-messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/chat-messages - Delete a message
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get('id');

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID required' }, { status: 400 });
    }

    // Verify the message belongs to a conversation owned by the user
    const { data: message, error: msgError } = await supabase
      .from('chat_messages')
      .select('conversation_id')
      .eq('id', messageId)
      .single();

    if (msgError || !message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    const { data: conversation, error: convError } = await supabase
      .from('chat_conversations')
      .select('id')
      .eq('id', message.conversation_id)
      .eq('user_id', user.id)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Delete the message
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      console.error('Error deleting message:', error);
      return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/chat-messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}