import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { extractConversationInsights } from '@/lib/user-memory';
import { OpenAI } from 'openai';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
}) : null;

/**
 * Extract insights from a conversation and store them as memories
 * POST /api/user-memory/extract-insights
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId, conversationText } = await req.json();

    if (!conversationText) {
      return NextResponse.json({ error: 'Conversation text required' }, { status: 400 });
    }

    // Use AI to extract insights from the conversation
    if (!openai) {
      return NextResponse.json({ error: 'AI not configured' }, { status: 503 });
    }

    const prompt = `Analyze the following conversation and extract key insights about the user. 
    Identify:
    1. User preferences (communication style, level of detail preferred, etc.)
    2. Key facts about their legal case
    3. Patterns in their questions or concerns
    4. Goals or desired outcomes
    5. Any concerns or worries mentioned
    
    Return a JSON array of insights, each with:
    - insight_type: "preference" | "fact" | "pattern" | "concern" | "goal"
    - insight_text: A clear description of the insight
    - supporting_evidence: A quote or evidence from the conversation
    - confidence: A number between 0 and 1
    
    Conversation:
    ${conversationText}
    
    Return only valid JSON array, no other text.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at analyzing conversations and extracting meaningful insights about users. Return only valid JSON arrays.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(responseText);
    const insights = parsed.insights || parsed || [];

    // Store insights
    const storedInsights = await extractConversationInsights(
      user.id,
      conversationId || '',
      conversationText
    );

    return NextResponse.json({
      success: true,
      insights: storedInsights,
      extracted: insights
    });

  } catch (error) {
    console.error('Error extracting insights:', error);
    return NextResponse.json(
      { error: 'Failed to extract insights' },
      { status: 500 }
    );
  }
}


