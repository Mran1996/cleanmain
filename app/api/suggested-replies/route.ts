import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client if available
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Lightweight heuristic suggestions generator based on recent chat content and category.
// Returns simple string suggestions consumed by Step 1 and split-pane pages.

async function generateAISuggestions(messages: Array<{ sender: string; text: string }>, category?: string): Promise<string[]> {
  // Get the last assistant message to understand what question was asked
  const assistantMessages = messages.filter(m => m.sender === 'assistant');
  const lastAssistantMessage = assistantMessages[assistantMessages.length - 1];
  
  // Get recent conversation context (last 3 messages)
  const recentMessages = messages.slice(-6);
  const conversationContext = recentMessages
    .map(m => `${m.sender === 'assistant' ? 'Assistant' : 'User'}: ${m.text}`)
    .join('\n');

  if (!lastAssistantMessage || !openai) {
    // Fallback to keyword-based suggestions if no AI or no assistant message
    return detectSuggestions(messages, category);
  }

  try {
    const systemPrompt = `You are a legal assistant helping generate suggested responses for users. Based on the conversation context, generate 3-4 short, natural suggested responses that would be helpful for the user to answer the assistant's question or continue the conversation.

Rules:
- Keep each suggestion under 15 words
- Make them sound natural and conversational
- Base them on what the assistant just asked
- If the assistant asked a specific question, provide answers that directly address it
- If the assistant is gathering information, provide responses that help provide that information
- Make suggestions relevant to the legal consultation context
- Return a JSON object with a "suggestions" key containing an array of strings

Example format: {"suggestions": ["Response 1", "Response 2", "Response 3", "Response 4"]}`;

    const userPrompt = `Conversation context:
${conversationContext}

The assistant just asked: "${lastAssistantMessage.text}"

Generate 3-4 suggested responses that would be helpful for the user to respond to this question or continue the conversation. Return as JSON object with "suggestions" array.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Use cheaper model for suggestions
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 200,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content || '';
    
    // Parse JSON response
    try {
      const parsed = JSON.parse(content);
      if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
        return parsed.suggestions.slice(0, 4).filter((s: any) => typeof s === 'string' && s.trim().length > 0);
      }
      // Fallback: if it's already an array
      if (Array.isArray(parsed)) {
        return parsed.slice(0, 4).filter((s: any) => typeof s === 'string' && s.trim().length > 0);
      }
    } catch {
      // If not JSON, try to extract array from text
      const arrayMatch = content.match(/\[(.*?)\]/s);
      if (arrayMatch) {
        try {
          const suggestions = JSON.parse(arrayMatch[0]);
          if (Array.isArray(suggestions)) {
            return suggestions.slice(0, 4).filter((s: any) => typeof s === 'string' && s.trim().length > 0);
          }
        } catch {
          // Fall through to keyword-based
        }
      }
    }
  } catch (error) {
    console.error('Error generating AI suggestions:', error);
    // Fallback to keyword-based suggestions
  }

  return detectSuggestions(messages, category);
}

function detectSuggestions(messages: Array<{ sender: string; text: string }>, category?: string): string[] {
  const MASTER = {
    default: [
      'I need help with a legal document',
      'I want to understand my legal options',
      'Can you explain what I should do?',
      "I'm not sure what to file.",
    ],
    criminal: [
      'I need help with a post-conviction motion.',
      'I want to challenge my conviction.',
      'I want to file a motion to reduce my sentence.',
      'I need help preparing for my criminal appeal.',
    ],
    civilRights: [
      'I want to file a civil suit against the prison.',
      'I was assaulted by a corrections officer.',
      'I need to report abuse or mistreatment in jail.',
      'I want to file a federal 1983 civil rights complaint.',
    ],
    civil: [
      'I need help with a civil lawsuit.',
      'I want to file a demand letter.',
      'I have an employment dispute regarding unpaid wages.',
      'I need help with a landlord-tenant issue.',
    ],
    motions: [
      'I want to file a motion to dismiss.',
      'I want to file a motion to suppress evidence.',
      'I need help preparing a discovery motion.',
      'I want to file a motion in limine.',
    ],
    appeals: [
      'I want to appeal my conviction.',
      'I need help filing an appeal.',
      'I want to prepare an appellate brief.',
      'I need help identifying reversible errors.',
    ],
    sentenceModification: [
      'I want to request a sentence reduction.',
      'I need help filing a resentencing motion.',
      'I want to correct my sentence or record.',
      "I'm eligible under new sentencing laws.",
    ],
  } as const;

  if (!messages || messages.length === 0) {
    return MASTER.default.slice(0, 4);
  }

  const recentUser = messages
    .filter((m) => m.sender === 'user')
    .slice(-3)
    .map((m) => m.text.toLowerCase())
    .join(' ');

  // Category-weighted suggestions
  if (category && category.toLowerCase() === 'criminal') {
    if (recentUser.includes('appeal') || recentUser.includes('conviction') || recentUser.includes('verdict') || recentUser.includes('lost trial')) {
      return MASTER.appeals.slice(0, 4);
    }
    if (recentUser.includes('sentence') || recentUser.includes('resentencing') || recentUser.includes('reduction') || recentUser.includes('time served')) {
      return MASTER.sentenceModification.slice(0, 4);
    }
    if (recentUser.includes('motion') || recentUser.includes('dismiss') || recentUser.includes('suppress') || recentUser.includes('discovery') || recentUser.includes('evidence')) {
      return MASTER.motions.slice(0, 4);
    }
    if (recentUser.includes('prison') || recentUser.includes('jail') || recentUser.includes('assault') || recentUser.includes('abuse') || recentUser.includes('mistreatment') || recentUser.includes('guard') || recentUser.includes('officer')) {
      return MASTER.civilRights.slice(0, 4);
    }
    return MASTER.criminal.slice(0, 4);
  }

  if (category && category.toLowerCase() === 'civil') {
    if (recentUser.includes('wage') || recentUser.includes('employment') || recentUser.includes('pay') || recentUser.includes('salary') || recentUser.includes('overtime')) {
      return MASTER.civil.slice(0, 4);
    }
    if (recentUser.includes('landlord') || recentUser.includes('tenant') || recentUser.includes('eviction') || recentUser.includes('rent') || recentUser.includes('lease')) {
      return MASTER.civil.slice(0, 4);
    }
    if (recentUser.includes('discrimination') || recentUser.includes('harassment') || recentUser.includes('wrongful termination')) {
      return MASTER.civil.slice(0, 4);
    }
    return MASTER.civil.slice(0, 4);
  }

  // General keyword detection
  if (recentUser.includes('appeal') || recentUser.includes('conviction') || recentUser.includes('trial') || recentUser.includes('sentence') || recentUser.includes('guilty') || recentUser.includes('innocent')) {
    return MASTER.criminal.slice(0, 4);
  }
  if (recentUser.includes('prison') || recentUser.includes('jail') || recentUser.includes('assault') || recentUser.includes('abuse') || recentUser.includes('mistreatment') || recentUser.includes('guard') || recentUser.includes('officer')) {
    return MASTER.civilRights.slice(0, 4);
  }
  if (recentUser.includes('wage') || recentUser.includes('landlord') || recentUser.includes('tenant') || recentUser.includes('employment') || recentUser.includes('work') || recentUser.includes('job')) {
    return MASTER.civil.slice(0, 4);
  }
  if (recentUser.includes('charges') || recentUser.includes('arrested') || recentUser.includes('indicted') || recentUser.includes('prosecution') || recentUser.includes('criminal')) {
    return MASTER.criminal.slice(0, 4);
  }
  if (recentUser.includes('motion') || recentUser.includes('dismiss') || recentUser.includes('suppress') || recentUser.includes('discovery') || recentUser.includes('evidence') || recentUser.includes('court')) {
    return MASTER.motions.slice(0, 4);
  }

  return MASTER.default.slice(0, 4);
}

export async function POST(req: NextRequest) {
  let body: any = {};
  let messages: Array<{ sender: string; text: string }> = [];
  let category: string | undefined = undefined;

  try {
    // Be resilient to empty body or invalid JSON
    try {
      const raw = await req.text();
      body = raw && raw.trim().length > 0 ? JSON.parse(raw) : {};
    } catch (parseErr) {
      // Fallback to empty body on parse errors
      body = {};
    }

    messages = Array.isArray(body?.messages) ? body.messages : [];
    category = typeof body?.category === 'string' ? body.category : undefined;

    // Try AI-generated suggestions first, fallback to keyword-based
    const suggestions = await generateAISuggestions(messages, category);
    
    // Ensure we always return at least some suggestions
    const finalSuggestions = suggestions.length > 0 
      ? suggestions 
      : detectSuggestions(messages, category);
    
    return NextResponse.json({ suggestions: finalSuggestions });
  } catch (error) {
    console.error('Error in /api/suggested-replies:', error);
    // Always respond with a safe default to avoid client errors
    const fallbackSuggestions = detectSuggestions(messages, category);
    return NextResponse.json({ suggestions: fallbackSuggestions.length > 0 ? fallbackSuggestions : ['I need help', 'Can you explain?', 'What should I do?'] }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}