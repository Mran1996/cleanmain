import { NextRequest, NextResponse } from 'next/server';
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Test document context
    const testDocumentText = "This is a test legal document about a landlord-tenant dispute in Washington State. The tenant is being evicted for non-payment of rent, but claims the landlord failed to make necessary repairs.";
    
    const systemPrompt = `You are Khristian, a knowledgeable and friendly legal assistant. You help users understand legal documents and provide guidance on legal matters.

IMPORTANT: The user has uploaded a legal document and you have access to its content. You should reference this document when responding to their questions.

Document Content:
${testDocumentText}

When the user asks about the document, explain it clearly and reference specific details from the content above. Be helpful, clear, and professional.`;

    // Initialize OpenAI
    const useKimi = !!process.env.MOONSHOT_API_KEY;
    const openai = !useKimi && process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

    // Test with a simple question
    const messagesForOpenAI = [
      { role: "system", content: systemPrompt },
      { role: "user", content: "Can you explain this document?" }
    ];

    let completion: any;
    if (useKimi) {
      const r = await fetch('https://api.moonshot.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.MOONSHOT_API_KEY}` },
        body: JSON.stringify({ model: 'kimi-k2-0905-preview', messages: messagesForOpenAI, temperature: 0.7 })
      });
      if (!r.ok) {
        const text = await r.text();
        throw new Error(`Kimi API error: ${r.status} - ${text}`);
      }
      completion = await r.json();
    } else {
      if (!openai) throw new Error('OpenAI not configured');
      completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: messagesForOpenAI,
        temperature: 0.7,
        max_tokens: 1000,
      });
    }

    const response = completion.choices?.[0]?.message?.content || "No response generated";

    return NextResponse.json({
      success: true,
      test: "Document context chat test",
      response: response,
      systemPromptLength: systemPrompt.length,
      documentTextLength: testDocumentText.length
    });

  } catch (error) {
    console.error("Test chat error:", error);
    return NextResponse.json({
      error: "Test failed",
      details: error.message
    }, { status: 500 });
  }
} 